/**
 * RQS (Reputation Quality Score) Calculator Service
 * 
 * This service provides functions to calculate and update user RQS scores.
 * The actual calculation is performed by the database function calculate_user_rqs()
 * which implements the complete formula with all four components.
 */

/**
 * Calculate and update RQS for a specific user
 * Calls the database function which handles all the complex calculations
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object>} RQS calculation results
 */
window.calculateUserRQS = async function (userId) {
    if (!window.supabase) throw new Error('Supabase not initialized');
    if (!userId) throw new Error('User ID required');

    try {
        // Calculating RQS for user (logging disabled for security)

        // Call the database function
        const { data, error } = await window.supabase.rpc('calculate_user_rqs', {
            target_user_id: userId
        });

        if (error) {
            console.error('❌ RQS calculation error:', error);
            throw error;
        }

        console.log('✅ RQS calculated:', data);
        return data;
    } catch (err) {
        console.error('Failed to calculate RQS:', err);
        throw err;
    }
};

/**
 * Recalculate RQS for all users in the database
 * Use this for initial migration or bulk updates
 * 
 * @returns {Promise<Object>} Summary of recalculation results
 */
window.recalculateAllUsersRQS = async function () {
    if (!window.supabase) throw new Error('Supabase not initialized');

    try {
        console.log('🔄 Starting bulk RQS recalculation for all users...');

        // Get all user IDs
        const { data: users, error: fetchError } = await window.supabase
            .from('profiles')
            .select('id, username, full_name');

        if (fetchError) throw fetchError;

        console.log(`Found ${users.length} users to recalculate`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process in batches to avoid overwhelming the database
        const batchSize = 10;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);

            await Promise.all(batch.map(async (user) => {
                try {
                    await window.calculateUserRQS(user.id);
                    successCount++;
                    // RQS recalculated successfully
                } catch (err) {
                    errorCount++;
                    errors.push({ user: user.username, error: err.message });
                    console.error(`❌ Failed for ${user.username}:`, err);
                }
            }));

            // Small delay between batches
            if (i + batchSize < users.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        const summary = {
            total: users.length,
            success: successCount,
            failed: errorCount,
            errors: errors
        };

        console.log('🎉 Bulk RQS recalculation complete:', summary);
        return summary;
    } catch (err) {
        console.error('Failed to recalculate all users RQS:', err);
        throw err;
    }
};

/**
 * Update weekly activity streak for a user
 * Call this when a user performs an activity (post, comment, etc.)
 * 
 * @param {string} userId - UUID of the user
 */
window.updateWeeklyActivity = async function (userId) {
    if (!window.supabase) throw new Error('Supabase not initialized');
    if (!userId) throw new Error('User ID required');

    try {
        const now = new Date();
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of current week
        currentWeekStart.setHours(0, 0, 0, 0);

        // Get user's last active week
        const { data: profile } = await window.supabase
            .from('profiles')
            .select('last_active_week, active_weeks_count')
            .eq('id', userId)
            .single();

        if (!profile) return;

        const lastActiveWeek = profile.last_active_week ? new Date(profile.last_active_week) : null;
        const currentCount = profile.active_weeks_count || 0;

        // Check if this is a new active week
        if (!lastActiveWeek || lastActiveWeek < currentWeekStart) {
            // This is a new active week
            await window.supabase
                .from('profiles')
                .update({
                    last_active_week: now.toISOString(),
                    active_weeks_count: currentCount + 1
                })
                .eq('id', userId);

            // Updated weekly activity for user

            // Recalculate RQS since consistency score changed
            await window.calculateUserRQS(userId);
        }
    } catch (err) {
        console.error('Failed to update weekly activity:', err);
        // Don't throw - this is a background operation
    }
};

/**
 * Get detailed RQS breakdown for a user
 * This fetches the component scores from the database
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object>} RQS breakdown
 */
window.getUserRQSBreakdown = async function (userId) {
    if (!window.supabase) throw new Error('Supabase not initialized');
    if (!userId) throw new Error('User ID required');

    try {
        const { data, error } = await window.supabase
            .from('profiles')
            .select('rqs_score, rqs_consistency_score, rqs_verification_score, rqs_impact_score, rqs_legacy_score')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return {
            total: data.rqs_score || 0,
            consistency: data.rqs_consistency_score || 0,
            verification: data.rqs_verification_score || 0,
            impact: data.rqs_impact_score || 0,
            legacy: data.rqs_legacy_score || 0
        };
    } catch (err) {
        console.error('Failed to get RQS breakdown:', err);
        throw err;
    }
};

console.log('✅ RQS Calculator Service loaded');
