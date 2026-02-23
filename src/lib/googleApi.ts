const SCOPES =
	"https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email";

export interface Product {
	id: string;
	name: string;
	category: string;
	purchasePrice: number;
	sellingPrice: number;
	stock: number;
}

// biome-ignore lint/suspicious/noExplicitAny: Mocking missing Google types
let tokenClient: any = null;
let currentToken = localStorage.getItem("gsi_access_token") || "";
let tokenExpiry = Number(localStorage.getItem("gsi_token_expiry")) || 0;

export function initGoogleIdentity(
	clientId: string,
	callback: (isAuthenticated: boolean) => void,
) {
	// Check if we have a valid stored token
	if (currentToken && Date.now() < tokenExpiry) {
		callback(true);
		// Proceed to initialize client in the background for renewals if needed
	} else {
		// Clear invalid/expired token
		currentToken = "";
		localStorage.removeItem("gsi_access_token");
		localStorage.removeItem("gsi_token_expiry");
	}

	// @ts-expect-error
	if (!window.google) {
		console.error("Google accounts script not loaded.");
		if (!currentToken) callback(false);
		return;
	}

	// @ts-expect-error
	tokenClient = window.google.accounts.oauth2.initTokenClient({
		client_id: clientId,
		scope: SCOPES,
		// biome-ignore lint/suspicious/noExplicitAny: Mocking missing Google types
		callback: (tokenResponse: any) => {
			if (tokenResponse.error !== undefined) {
				console.error("Auth error:", tokenResponse.error);
				callback(false);
				return;
			}
			currentToken = tokenResponse.access_token;
			// tokenResponse.expires_in is in seconds
			tokenExpiry =
				Date.now() + Number(tokenResponse.expires_in) * 1000 - 60000; // Subtract 1 min buffer

			localStorage.setItem("gsi_access_token", currentToken);
			localStorage.setItem("gsi_token_expiry", tokenExpiry.toString());

			callback(true);
		},
	});
}

export function promptLogin() {
	if (tokenClient) {
		tokenClient.requestAccessToken({ prompt: "consent" });
	} else {
		console.error("Token client not initialized.");
	}
}

export function isAuthenticated(): boolean {
	return currentToken !== "";
}

export function logout() {
	currentToken = "";
	tokenExpiry = 0;
	initPromise = null;
	localStorage.removeItem("gsi_access_token");
	localStorage.removeItem("gsi_token_expiry");
}

function getHeaders() {
	return {
		Authorization: `Bearer ${currentToken}`,
		"Content-Type": "application/json",
	};
}

// -------------------------------------------------------------
// Drive API - Find or Create Spreadsheet
// -------------------------------------------------------------

async function fetchUserEmail(): Promise<string | null> {
	try {
		const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
			headers: getHeaders(),
		});
		const data = await res.json();
		return data.email || null;
	} catch (error) {
		console.error("Error fetching user email:", error);
		return null;
	}
}

async function findOrCreateFolder(
	folderName: string,
	parentId?: string,
): Promise<string | null> {
	try {
		const parentQuery = parentId ? ` and '${parentId}' in parents` : "";
		const q = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentQuery}`;

		const searchRes = await fetch(
			`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
			{ headers: getHeaders() },
		);
		const searchData = await searchRes.json();

		if (searchData.files && searchData.files.length > 0) {
			return searchData.files[0].id;
		}

		// Create folder if not found
		const body: { name: string; mimeType: string; parents?: string[] } = {
			name: folderName,
			mimeType: "application/vnd.google-apps.folder",
		};
		if (parentId) {
			body.parents = [parentId];
		}

		const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
			method: "POST",
			headers: getHeaders(),
			body: JSON.stringify(body),
		});
		const createData = await createRes.json();
		return createData.id;
	} catch (error) {
		console.error(`Error finding/creating folder ${folderName}:`, error);
		return null;
	}
}

let initPromise: Promise<string | null> | null = null;

export async function initSpreadsheet(): Promise<string | null> {
	if (initPromise) return initPromise;

	initPromise = (async () => {
		const email = await fetchUserEmail();
		if (!email) {
			console.error("Failed to fetch user email");
			return null;
		}

		const fileName = `${email}__Inventory_Catalog_App`;

		try {
			// 1. Get/Create "apps" folder
			const appsFolderId = await findOrCreateFolder("apps");
			if (!appsFolderId) return null;

			// 2. Get/Create "find_product" folder inside "apps"
			const findProductFolderId = await findOrCreateFolder(
				"find_product",
				appsFolderId,
			);
			if (!findProductFolderId) return null;

			// 3. Search for existing file inside "find_product"
			const q = `name='${fileName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false and '${findProductFolderId}' in parents`;
			const searchRes = await fetch(
				`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
				{ headers: getHeaders() },
			);
			const searchData = await searchRes.json();

			if (searchData.files && searchData.files.length > 0) {
				return searchData.files[0].id;
			}

			// 4. Create if not found inside "find_product" folder
			const createRes = await fetch(
				"https://sheets.googleapis.com/v4/spreadsheets",
				{
					method: "POST",
					headers: getHeaders(),
					body: JSON.stringify({
						properties: { title: fileName },
					}),
				},
			);
			const createData = await createRes.json();
			const spreadsheetId = createData.spreadsheetId;

			// Immediately update the file to move it into the desired folder
			// (Sheets API v4 creates in root by default, so we use Drive v3 to move it)
			const getFileRes = await fetch(
				`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=parents`,
				{ headers: getHeaders() },
			);
			const fileData = await getFileRes.json();
			const previousParents = fileData.parents ? fileData.parents.join(",") : "";

			await fetch(
				`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${findProductFolderId}&removeParents=${previousParents}`,
				{
					method: "PATCH",
					headers: getHeaders(),
				},
			);

			// 5. Add header row
			await appendSpreadsheetRow(spreadsheetId, [
				"ID",
				"Name",
				"Category",
				"Purchase Price",
				"Selling Price",
				"Stock",
			]);

			return spreadsheetId;
		} catch (error) {
			console.error("Error initializing spreadsheet:", error);
			return null;
		}
	})();

	return initPromise;
}

// -------------------------------------------------------------
// Sheets API - Data Operations
// -------------------------------------------------------------

export async function fetchProducts(spreadsheetId: string): Promise<Product[]> {
	try {
		const res = await fetch(
			`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:F`,
			{ headers: getHeaders() },
		);
		const data = await res.json();
		const rows = data.values || [];

		return rows.map((row: string[]) => ({
			id: row[0],
			name: row[1] || "",
			category: row[2] || "",
			purchasePrice: Number(row[3]) || 0,
			sellingPrice: Number(row[4]) || 0,
			stock: Number(row[5]) || 0,
		}));
	} catch (error) {
		console.error("Error fetching products:", error);
		return [];
	}
}

export async function appendSpreadsheetRow(
	spreadsheetId: string,
	values: (string | number)[],
): Promise<boolean> {
	try {
		const res = await fetch(
			`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:F:append?valueInputOption=USER_ENTERED`,
			{
				method: "POST",
				headers: getHeaders(),
				body: JSON.stringify({ values: [values] }),
			},
		);
		return res.ok;
	} catch (error) {
		console.error("Error appending row:", error);
		return false;
	}
}

export async function updateSpreadsheetRow(
	spreadsheetId: string,
	rowIndex: number,
	values: (string | number)[],
): Promise<boolean> {
	// Row 1 is header, Row 2 is data index 0. So exact sheet row is rowIndex + 2.
	const sheetRow = rowIndex + 2;
	try {
		const res = await fetch(
			`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A${sheetRow}:F${sheetRow}?valueInputOption=USER_ENTERED`,
			{
				method: "PUT",
				headers: getHeaders(),
				body: JSON.stringify({ values: [values] }),
			},
		);
		return res.ok;
	} catch (error) {
		console.error("Error updating row:", error);
		return false;
	}
}
