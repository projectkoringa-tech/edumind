import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export async function addXP(userId: string, amount: number) {
  if (!userId) return;
  
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const data = userSnap.data();
  const today = new Date().toISOString().split('T')[0];
  
  let dailyXP = data.dailyXP || 0;
  const lastXPDate = data.lastXPDate || '';
  
  // Reset daily XP if it's a new day
  if (lastXPDate !== today) {
    dailyXP = 0;
  }
  
  const DAILY_CAP = 5000;
  
  if (dailyXP >= DAILY_CAP) {
    console.log('XP Cap reached for today');
    return { capped: true, dailyXP };
  }
  
  // Respect the cap
  const availableXP = Math.min(amount, DAILY_CAP - dailyXP);
  if (availableXP <= 0) return { capped: true, dailyXP };

  const currentXP = data.xp || 0;
  const newXP = currentXP + availableXP;
  const newDailyXP = dailyXP + availableXP;
  
  // Level logic: each level takes 1000 XP
  // Level 1: 0-999
  // Level 2: 1000-1999
  // ...
  const newLevel = Math.floor(newXP / 1000) + 1;
  const currentLevel = data.level || 1;

  // Logic for Relaxo Time: 5 minutes per XP earned if Level >= 3 and Level < 20
  let relaxoTimeBonus = 0;
  if (newLevel >= 3 && newLevel < 20) {
    relaxoTimeBonus = availableXP * 5;
  }
  
  try {
    const updateData: any = {
      xp: newXP,
      level: newLevel,
      dailyXP: newDailyXP,
      lastXPDate: today,
      updatedAt: serverTimestamp()
    };

    if (relaxoTimeBonus > 0) {
      updateData.relaxoTimeMinutes = (data.relaxoTimeMinutes || 0) + relaxoTimeBonus;
    }
    
    console.info('Updating XP for user:', userId, updateData);
    await updateDoc(userRef, updateData);
    console.info('XP updated successfully');
  } catch (error) {
    console.error('Error updating XP:', error);
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
  
  return { newXP, newLevel, leveledUp: newLevel > currentLevel, added: availableXP, dailyXP: newDailyXP };
}

export async function addRelaxoXP(userId: string, amount: number) {
  if (!userId) return;
  
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const data = userSnap.data();
  const currentXP = data.relaxoXP || 0;
  const newXP = currentXP + amount;
  
  // Level logic for Relaxo: each level takes 500 XP (faster progression for games)
  const newLevel = Math.floor(newXP / 500) + 1;
  const currentLevel = data.relaxoLevel || 1;
  
  try {
    const updateData = {
      relaxoXP: newXP,
      relaxoLevel: newLevel,
      updatedAt: serverTimestamp()
    };
    
    console.info('Updating Relaxo XP for user:', userId, updateData);
    await updateDoc(userRef, updateData);
    console.info('Relaxo XP updated successfully');
  } catch (error) {
    console.error('Error updating Relaxo XP:', error);
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
  
  return { newXP, newLevel, leveledUp: newLevel > currentLevel, added: amount };
}
