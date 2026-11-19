'use strict'
const { onSchedule } = require('firebase-functions/v2/scheduler')
const logger = require('firebase-functions/logger')
const firestore = require('@google-cloud/firestore')

// Daily Firestore export to a dedicated bucket. NOT active until billing (Blaze), the bucket and IAM roles are set
// up - see docs/BACKUP_AND_RECOVERY.md. Retention is enforced by the bucket lifecycle rule, not by this function.
exports.scheduledFirestoreBackup = onSchedule({ schedule: 'every day 02:00', timeZone: 'Asia/Kolkata', retryCount: 2 }, async () => {
  const project = process.env.GCLOUD_PROJECT
  const bucket = process.env.BACKUP_BUCKET || `gs://${project}-medicloud-backups`
  const client = new firestore.v1.FirestoreAdminClient()
  const [op] = await client.exportDocuments({ name: client.databasePath(project, '(default)'), outputUriPrefix: `${bucket}/firestore/${new Date().toISOString().slice(0, 10)}`, collectionIds: [] })
  logger.info('Firestore export started', { operation: op.name })
})
