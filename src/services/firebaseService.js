import { db } from '../firebase-config';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

// =============================================================================
// USER TIP FUNCTIONS
// =============================================================================

/**
 * Get user's current tip counts from database
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} User tip data
 */
export const getUserTips = async (userId) => {
  try {
    console.log('🔍 Loading tips for user:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const tipData = {
        totalTipsReceived: userData.totalTipsReceived || 0,
        totalTipsGiven: userData.totalTipsGiven || 0,
        lastActiveAt: userData.lastActiveAt
      };
      
      console.log('✅ Tips loaded:', tipData);
      return tipData;
    } else {
      console.log('👤 New user, no tips data found');
      return {
        totalTipsReceived: 0,
        totalTipsGiven: 0,
        lastActiveAt: null
      };
    }
  } catch (error) {
    console.error('❌ Error loading user tips:', error);
    throw error;
  }
};

/**
 * Initialize new user in database
 * @param {string} userId - Firebase user ID  
 * @param {Object} userData - User profile data
 * @returns {Promise<void>}
 */
export const initializeUser = async (userId, userData) => {
  try {
    console.log('👤 Initializing user:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    // Only create if user doesn't exist
    if (!userSnap.exists()) {
      await setDoc(userRef, {
  userId: userId,
  email: userData.email || '',
  displayName: userData.displayName || 'Anonymous',
  totalTipsReceived: 0,
  totalTipsGiven: 0,
  reportsReceived: 0,  // ADD THIS LINE
  createdAt: serverTimestamp(),
  lastActiveAt: serverTimestamp()
});
      
      console.log('✅ User initialized successfully');
    } else {
      // Update last active time for existing user
      await updateDoc(userRef, {
        lastActiveAt: serverTimestamp()
      });
      
      console.log('✅ User last active time updated');
    }
  } catch (error) {
    console.error('❌ Error initializing user:', error);
    throw error;
  }
};

/**
 * Report a user (real-time Firebase update)
 * @param {string} reportedUserId - User being reported
 * @returns {Promise<void>}
 */
export const reportUser = async (reportedUserId) => {
  try {
    console.log('🚨 Reporting user:', reportedUserId);
    
    const userRef = doc(db, 'users', reportedUserId);
    await updateDoc(userRef, {
      reportsReceived: increment(1),
      lastActiveAt: serverTimestamp()
    });
    
    console.log('✅ User report saved to database');
  } catch (error) {
    console.error('❌ Error reporting user:', error);
    throw error;
  }
};


/**
 * Update user's tip counts in database
 * @param {string} userId - Firebase user ID
 * @param {Object} tipChanges - Changes to apply
 * @returns {Promise<void>}
 */
export const updateUserTips = async (userId, tipChanges) => {
  try {
    console.log('💾 Updating tips for user:', userId, tipChanges);
    
    const userRef = doc(db, 'users', userId);
    const updateData = {
      lastActiveAt: serverTimestamp()
    };
    
    // Use Firebase increment for atomic updates
    if (tipChanges.tipsReceivedChange) {
      updateData.totalTipsReceived = increment(tipChanges.tipsReceivedChange);
    }
    
    if (tipChanges.tipsGivenChange) {
      updateData.totalTipsGiven = increment(tipChanges.tipsGivenChange);
    }
    
    await updateDoc(userRef, updateData);
    
    console.log('✅ User tips updated successfully');
  } catch (error) {
    console.error('❌ Error updating user tips:', error);
    throw error;
  }
};

// =============================================================================
// SESSION TIP FUNCTIONS  
// =============================================================================

/**
 * Save tip session data to database
 * @param {Object} sessionData - Session tip information
 * @returns {Promise<void>}
 */
export const saveTipSession = async (sessionData) => {
  try {
    const { 
      userId, 
      partnerId, 
      tipsGiven, 
      tipsReceived, 
      chatDuration,
      timestamp 
    } = sessionData;
    
    console.log('💾 SAVING SESSION:', {
      userId: userId,
      tipsGiven: tipsGiven,
      tipsReceived: tipsReceived
    });
    
    // Only save if there were actual tip changes
    if (tipsGiven === 0 && tipsReceived === 0) {
      console.log('⏭️ No tips in session, skipping save');
      return;
    }
    
    // Use batch for atomic updates
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', userId);
    const updateData = {
      lastActiveAt: serverTimestamp()
    };
    
    if (tipsGiven > 0) {
      updateData.totalTipsGiven = increment(tipsGiven);
      console.log('📈 Will increment totalTipsGiven by:', tipsGiven);
    }
    
    if (tipsReceived > 0) {
      updateData.totalTipsReceived = increment(tipsReceived);
      console.log('📈 Will increment totalTipsReceived by:', tipsReceived);
    }
    
    // Update user document
    batch.update(userRef, updateData);
    
    // Save session history
    const sessionId = `${userId}_${partnerId}_${timestamp}`;
    const sessionRef = doc(db, 'tipSessions', sessionId);
    batch.set(sessionRef, {
      userId,
      partnerId,
      tipsGiven,
      tipsReceived,
      chatDuration,
      timestamp: serverTimestamp()
    });
    
    // Commit batch (only once!)
    await batch.commit();
    
    console.log('✅ Tip session saved successfully');
  } catch (error) {
    console.error('❌ Error saving tip session:', error);
    throw error;
  }
};

/**
 * Batch update multiple users' tips efficiently
 * @param {Array} updates - Array of {userId, tipChanges} objects
 * @returns {Promise<void>}
 */
export const batchUpdateTips = async (updates) => {
  try {
    console.log('📦 Batch updating tips for', updates.length, 'users');
    
    const batch = writeBatch(db);
    
    updates.forEach(({ userId, tipChanges }) => {
      const userRef = doc(db, 'users', userId);
      const updateData = {
        lastActiveAt: serverTimestamp()
      };
      
      if (tipChanges.tipsReceivedChange) {
        updateData.totalTipsReceived = increment(tipChanges.tipsReceivedChange);
      }
      
      if (tipChanges.tipsGivenChange) {
        updateData.totalTipsGiven = increment(tipChanges.tipsGivenChange);
      }
      
      batch.update(userRef, updateData);
    });
    
    await batch.commit();
    
    console.log('✅ Batch tip update completed');
  } catch (error) {
    console.error('❌ Error in batch tip update:', error);
    throw error;
  }
};

//backend batch sync

export const batchSyncTipsFromBackend = async (tipDataArray) => {
  try {
    console.log('🔄 Backend syncing tips for', tipDataArray.length, 'users');
    
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    
    for (const { userId, given, received } of tipDataArray) {
      const userRef = doc(db, 'users', userId);
      
      // Overwrite with Redis values (Redis is source of truth)
      batch.set(userRef, {
        totalTipsGiven: given,
        totalTipsReceived: received,
        lastSyncedAt: timestamp,
        lastActiveAt: timestamp
      }, { merge: true }); // Merge so we don't lose other fields
    }
    
    await batch.commit();
    console.log('✅ Backend sync completed');
  } catch (error) {
    console.error('❌ Backend sync failed:', error);
    throw error;
  }
};



// =============================================================================
// USER PROFILE FUNCTIONS
// =============================================================================

/**
 * Get complete user profile data
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} Complete user data
 */
export const getUserProfile = async (userId) => {
  try {
    console.log('👤 Loading user profile:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log('✅ User profile loaded');
      return userData;
    } else {
      console.log('❌ User profile not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading user profile:', error);
    throw error;
  }
};

/**
 * Update user profile information
 * @param {string} userId - Firebase user ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    console.log('👤 Updating user profile:', userId);
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...profileData,
      lastActiveAt: serverTimestamp()
    });
    
    console.log('✅ User profile updated successfully');
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if user exists in database
 * @param {string} userId - Firebase user ID
 * @returns {Promise<boolean>}
 */
export const userExists = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    console.error('❌ Error checking user existence:', error);
    return false;
  }
};

/**
 * Get user statistics
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} User statistics
 */
export const getUserStats = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        totalTipsReceived: userData.totalTipsReceived || 0,
        totalTipsGiven: userData.totalTipsGiven || 0,
        memberSince: userData.createdAt,
        lastActive: userData.lastActiveAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting user stats:', error);
    throw error;
  }
};

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Handle database errors gracefully
 * @param {Error} error - Database error
 * @param {string} operation - Operation that failed
 */
export const handleDatabaseError = (error, operation) => {
  console.error(`❌ Database error in ${operation}:`, error);
  
  // Log different error types
  if (error.code === 'permission-denied') {
    console.error('🔒 Permission denied - check Firestore rules');
  } else if (error.code === 'unavailable') {
    console.error('📡 Database unavailable - offline mode');
  } else if (error.code === 'quota-exceeded') {
    console.error('💰 Database quota exceeded');
  }
  
  throw error;
};