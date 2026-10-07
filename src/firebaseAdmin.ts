import fs from 'fs';
import path from 'path';
import type { DatabaseSchema, User } from './types.ts';

let config: { projectId: string; firestoreDatabaseId: string; apiKey: string } | null = null;
let baseUrl = '';

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (raw && raw.projectId && raw.firestoreDatabaseId && raw.apiKey) {
      config = {
        projectId: raw.projectId,
        firestoreDatabaseId: raw.firestoreDatabaseId,
        apiKey: raw.apiKey
      };
      baseUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
      console.log(`[Firestore REST] Initialized for project ${config.projectId}, db: ${config.firestoreDatabaseId}`);
    }
  }
} catch (e) {
  console.error('[Firestore REST] Failed to load config:', e);
}

// Module-level snapshot tracking what is stored in Firestore
let lastSyncedSnapshot: DatabaseSchema | null = null;

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFirestoreValue(field: any): any {
  if (!field || typeof field !== 'object') return null;
  if ('nullValue' in field) return null;
  if ('booleanValue' in field) return field.booleanValue;
  if ('integerValue' in field) return parseInt(field.integerValue, 10);
  if ('doubleValue' in field) return field.doubleValue;
  if ('stringValue' in field) return field.stringValue;
  if ('timestampValue' in field) return field.timestampValue;
  if ('arrayValue' in field) {
    const values = field.arrayValue?.values || [];
    return values.map(fromFirestoreValue);
  }
  if ('mapValue' in field) {
    const result: Record<string, any> = {};
    const fields = field.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      result[k] = fromFirestoreValue(v);
    }
    return result;
  }
  return null;
}

function docToData(doc: any): any {
  if (!doc || !doc.fields) return null;
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    result[k] = fromFirestoreValue(v);
  }
  return result;
}

function dataToFields(data: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return fields;
}

export const COLLECTIONS_WITH_ID = [
  'solicitudes',
  'clientes',
  'trabajadores',
  'cargasSociales',
  'tarifas',
  'beneficios',
  'contratos',
  'plantillas',
  'historialCargas',
  'facturas',
  'pagos',
  'logs',
  'reglasSla',
  'slaSeguimientos',
  'slaHistoriales',
  'contratosComerciales',
  'contratosLaborales',
  'adendums',
  'tiposCambio',
  'plantillasContrato',
  'tickets',
  'slaConfigs',
  'plantillasNotificacion',
  'alertasNotificacion',
  'historialNotificaciones',
  'seguimientosComerciales',
  'pagosContadoUSD',
  'historialLiberacion',
  'alertasOperativas',
  'historialAlertasOperativas',
  'auditLogs',
  'traducciones',
  'directorio',
  'cuentasBancarias',
  'tarifarios',
  'reglasTributarias',
  'roles'
];

export async function fetchCollectionDocs(collName: string): Promise<any[]> {
  if (!config || !baseUrl) return [];
  try {
    const res = await fetch(`${baseUrl}:runQuery?key=${config.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collName }]
        }
      })
    });
    if (!res.ok) {
      console.warn(`[Firestore REST] Query failed for ${collName}: status ${res.status}`);
      return [];
    }
    const list = await res.json();
    if (!Array.isArray(list)) return [];
    return list
      .filter((item: any) => item.document && item.document.fields)
      .map((item: any) => docToData(item.document));
  } catch (e) {
    console.error(`[Firestore REST] Error fetching ${collName}:`, e);
    return [];
  }
}

export async function saveDocToFirestore(collName: string, id: string, data: any): Promise<void> {
  if (!config || !baseUrl) return;
  try {
    const fields = dataToFields(data);
    const docId = encodeURIComponent(id);
    const res = await fetch(`${baseUrl}/${collName}/${docId}?key=${config.apiKey}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Firestore REST] PATCH failed for ${collName}/${id}: ${res.status} ${errText}`);
    } else {
      console.log(`[Firestore REST] Saved ${collName}/${id} successfully.`);
    }
  } catch (e) {
    console.error(`[Firestore REST] Error saving ${collName}/${id}:`, e);
  }
}

export async function deleteDocFromFirestore(collName: string, id: string): Promise<void> {
  if (!config || !baseUrl) return;
  try {
    const docId = encodeURIComponent(id);
    const res = await fetch(`${baseUrl}/${collName}/${docId}?key=${config.apiKey}`, {
      method: 'DELETE'
    });
    if (!res.ok && res.status !== 404) {
      console.warn(`[Firestore REST] DELETE failed for ${collName}/${id}: ${res.status}`);
    } else {
      console.log(`[Firestore REST] Deleted ${collName}/${id} successfully.`);
    }
  } catch (e) {
    console.error(`[Firestore REST] Error deleting ${collName}/${id}:`, e);
  }
}

export async function loadFromFirestore(): Promise<DatabaseSchema | null> {
  if (!config || !baseUrl) return null;

  try {
    console.log('[Firestore REST] Loading database from Firestore...');
    const dbData: Partial<DatabaseSchema> = {};

    // Check if usuarios exists first
    const users = await fetchCollectionDocs('usuarios');
    if (!users || users.length === 0) {
      console.log('[Firestore REST] No users found in Firestore, database is empty.');
      return null;
    }
    dbData.usuarios = users;

    // Load all other collections in parallel
    const entries = await Promise.all(
      COLLECTIONS_WITH_ID.map(async (coll) => {
        const docs = await fetchCollectionDocs(coll);
        return [coll, docs] as const;
      })
    );

    for (const [coll, docs] of entries) {
      (dbData as any)[coll] = docs;
    }

    // Load config/factura
    try {
      const cfgRes = await fetch(`${baseUrl}/config/factura?key=${config.apiKey}`);
      if (cfgRes.ok) {
        const json = await cfgRes.json();
        dbData.configuracionFactura = docToData(json);
      }
    } catch (e) {
      // ignore
    }

    // Load config/sistema
    try {
      const sysRes = await fetch(`${baseUrl}/config/sistema?key=${config.apiKey}`);
      if (sysRes.ok) {
        const json = await sysRes.json();
        dbData.configuracionSistema = docToData(json);
      }
    } catch (e) {
      // ignore
    }

    const fullDb = dbData as DatabaseSchema;
    // Set our tracked snapshot to this exact loaded state
    lastSyncedSnapshot = JSON.parse(JSON.stringify(fullDb));

    console.log(`[Firestore REST] Successfully loaded ${fullDb.usuarios?.length || 0} users and ${COLLECTIONS_WITH_ID.length} collections from Firestore.`);
    return fullDb;
  } catch (err) {
    console.error('[Firestore REST] Failed to load from Firestore:', err);
    return null;
  }
}

let isSyncing = false;
let pendingSyncData: DatabaseSchema | null = null;

export async function saveToFirestore(newData: DatabaseSchema, explicitOldData?: DatabaseSchema | null): Promise<void> {
  if (!config || !baseUrl) return;

  if (isSyncing) {
    pendingSyncData = newData;
    return;
  }
  isSyncing = true;

  try {
    const baseline = explicitOldData || lastSyncedSnapshot;

    // 1. Sync collections with ID
    for (const collName of COLLECTIONS_WITH_ID) {
      const newItems = ((newData as any)[collName] || []) as any[];
      const oldItems = baseline ? (((baseline as any)[collName] || []) as any[]) : [];

      const newMap = new Map<string, any>();
      for (const item of newItems) {
        if (item && item.id) newMap.set(String(item.id), item);
      }

      const oldMap = new Map<string, any>();
      for (const item of oldItems) {
        if (item && item.id) oldMap.set(String(item.id), item);
      }

      // Upsert new or changed
      for (const [id, item] of newMap.entries()) {
        const prev = oldMap.get(id);
        if (!prev || JSON.stringify(item) !== JSON.stringify(prev)) {
          await saveDocToFirestore(collName, id, item);
        }
      }

      // Delete removed items from Firestore
      if (baseline) {
        for (const id of oldMap.keys()) {
          if (!newMap.has(id)) {
            await deleteDocFromFirestore(collName, id);
          }
        }
      }
    }

    // 2. Sync usuarios (keyed by correo)
    const newUsers = newData.usuarios || [];
    const oldUsers = baseline ? (baseline.usuarios || []) : [];
    const newUserMap = new Map<string, User>();
    for (const u of newUsers) {
      if (u && u.correo) newUserMap.set(u.correo.toLowerCase(), u);
    }
    const oldUserMap = new Map<string, User>();
    for (const u of oldUsers) {
      if (u && u.correo) oldUserMap.set(u.correo.toLowerCase(), u);
    }

    for (const [correo, u] of newUserMap.entries()) {
      const prev = oldUserMap.get(correo);
      if (!prev || JSON.stringify(u) !== JSON.stringify(prev)) {
        await saveDocToFirestore('usuarios', correo, u);
      }
    }

    // Delete removed users from Firestore
    if (baseline) {
      for (const correo of oldUserMap.keys()) {
        if (!newUserMap.has(correo)) {
          await deleteDocFromFirestore('usuarios', correo);
        }
      }
    }

    // 3. Sync config
    if (newData.configuracionFactura) {
      await saveDocToFirestore('config', 'factura', newData.configuracionFactura);
    }
    if (newData.configuracionSistema) {
      await saveDocToFirestore('config', 'sistema', newData.configuracionSistema);
    }

    // Update tracked snapshot
    lastSyncedSnapshot = JSON.parse(JSON.stringify(newData));
  } catch (err) {
    console.error('[Firestore REST] Error in saveToFirestore delta:', err);
  } finally {
    isSyncing = false;
    if (pendingSyncData) {
      const nextData = pendingSyncData;
      pendingSyncData = null;
      saveToFirestore(nextData).catch(e => console.error('[Firestore REST] Error processing queued sync:', e));
    }
  }
}

export async function seedFirestore(initialDb: DatabaseSchema): Promise<void> {
  if (!config || !baseUrl) return;
  try {
    const existingUsers = await fetchCollectionDocs('usuarios');
    if (existingUsers && existingUsers.length > 0) {
      console.log(`[Firestore REST] Database already contains ${existingUsers.length} users in Firestore. Skipping seed to strictly preserve user edits and deletions.`);
      return;
    }

    console.log('[Firestore REST] Database is completely empty in Firestore. Seeding initial baseline accounts...');
    // Seed any initial users
    for (const u of (initialDb.usuarios || [])) {
      if (u && u.correo) {
        console.log(`[Firestore REST] Seeding initial baseline user: ${u.correo}`);
        await saveDocToFirestore('usuarios', u.correo.toLowerCase().trim(), u);
      }
    }

    // Seed items in other collections
    for (const collName of COLLECTIONS_WITH_ID) {
      const items = ((initialDb as any)[collName] || []) as any[];
      if (!items || items.length === 0) continue;

      for (const item of items) {
        if (item && item.id) {
          await saveDocToFirestore(collName, String(item.id), item);
        }
      }
    }

    if (initialDb.configuracionFactura) {
      await saveDocToFirestore('config', 'factura', initialDb.configuracionFactura);
    }
    if (initialDb.configuracionSistema) {
      await saveDocToFirestore('config', 'sistema', initialDb.configuracionSistema);
    }
    console.log('[Firestore REST] Initial seed completed successfully.');
  } catch (e) {
    console.error('[Firestore REST] Error seeding Firestore:', e);
  }
}

export async function wipeFirestore(): Promise<void> {
  // Safe helper
}
