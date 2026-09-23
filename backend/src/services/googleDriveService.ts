import { google, drive_v3 } from "googleapis";
import { pool } from "../db/pool";
import { Readable } from "stream";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/api/auth/google/callback"
  );
}

export function getAuthUrl(usuarioId: string) {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force to get refresh token
    state: usuarioId,  // Pass the user ID so we know who logged in on the callback
  });
}

/**
 * Obtiene las credenciales del usuario de la BD y configura el cliente de Google.
 */
async function getUserDrive(usuarioId: string) {
  const { rows } = await pool.query(
    "SELECT access_token, refresh_token, expiry_date FROM usuario_drive_tokens WHERE usuario_id = $1",
    [usuarioId]
  );
  if (rows.length === 0) {
    throw new Error("El usuario no ha vinculado su cuenta de Google Drive.");
  }
  
  const token = rows[0];
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expiry_date: token.expiry_date ? Number(token.expiry_date) : null,
  });

  // Listener para cuando la librería renueva el token automáticamente
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      await pool.query(
        "UPDATE usuario_drive_tokens SET access_token = $1, refresh_token = $2, expiry_date = $3 WHERE usuario_id = $4",
        [tokens.access_token, tokens.refresh_token, tokens.expiry_date, usuarioId]
      );
    } else {
      await pool.query(
        "UPDATE usuario_drive_tokens SET access_token = $1, expiry_date = $2 WHERE usuario_id = $3",
        [tokens.access_token, tokens.expiry_date, usuarioId]
      );
    }
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * Busca o crea una carpeta por nombre en Google Drive.
 */
async function getOrCreateFolder(drive: drive_v3.Drive, folderName: string, parentId?: string) {
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  } else {
    query += ` and 'root' in parents`; // Solo buscar en la raíz si no hay padre para no confundir con otras
  }

  const res = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  // Si no existe, crearla
  const fileMetadata: drive_v3.Schema$File = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id",
  });
  return folder.data.id!;
}

/**
 * Sube un archivo PDF a la nube en una subcarpeta específica dentro de "COMIF_Respaldos".
 */
export async function uploadPdfToDrive(usuarioId: string, base64Data: string, fileName: string, subfolderName: string) {
  const drive = await getUserDrive(usuarioId);
  
  // 1. Obtener/Crear la carpeta principal "COMIF_Respaldos"
  const rootFolderId = await getOrCreateFolder(drive, "COMIF_Respaldos");
  
  // 2. Obtener/Crear la subcarpeta
  const destFolderId = await getOrCreateFolder(drive, subfolderName, rootFolderId);

  // 3. Subir el archivo
  const buffer = Buffer.from(base64Data, "base64");
  
  const fileMetadata: drive_v3.Schema$File = {
    name: fileName,
    parents: [destFolderId],
  };

  const media = {
    mimeType: "application/pdf",
    body: Readable.from(buffer),
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id, webViewLink",
  });

  return file.data;
}
