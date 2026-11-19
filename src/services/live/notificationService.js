import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import { guard } from './helpers.js'
import { notifFromDoc } from './mappers.js'

export const getNotifications = async (uid) => (await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid)))).docs.map((d) => notifFromDoc(d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100)
export const markAsRead = guard(async (id) => { await updateDoc(doc(db, 'notifications', id), { isRead: true }); return null })
export const markAllAsRead = guard(async (uid) => {
  const snap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid), where('isRead', '==', false)))
  const b = writeBatch(db); snap.forEach((d) => b.update(d.ref, { isRead: true })); await b.commit(); return true
})
