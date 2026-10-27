/**
 * earnings.js — Earnings API module
 *
 * Ported from api.js. Function names and signatures are IDENTICAL.
 * Only changes: import/export syntax; window.supabase → supabase import;
 * window.getCurrentUser → getCurrentUser import; window.location.
 */

import { supabase } from '../supabaseClient.js'
import { getCurrentUser } from '../auth.js'

export async function getMyEarnings() {
    const user = await getCurrentUser();
    if (!user) return { total: 0, lastMonth: 0, logs: [], breakdown: [] };

    // 1. Fetch Logs
    const { data: logs, error: logsError } = await supabase
        .from('earnings_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (logsError) {
        console.error("Error fetching earnings logs:", logsError);
    }

    // 2. Fetch Pending/Processing Withdrawals (to show in history before they are logged as Paid)
    const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('id, amount, status, created_at, method')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

    if (withdrawalError) {
        console.error("Error fetching pending withdrawals:", withdrawalError);
    }

    // Combined logs list for the UI
    const allLogs = [
        ...(logs || []),
        ...(withdrawals || []).map(w => ({
            id: w.id,
            amount: -w.amount, // Negative for withdrawal
            source: 'Withdrawal',
            label: `Withdrawal (${w.method.toUpperCase()})`,
            status: w.status.charAt(0).toUpperCase() + w.status.slice(1),
            created_at: w.created_at,
            icon: 'Clock'
        }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 3. Fetch Profile Total (source of truth for total balance)
    const { data: profile } = await supabase
        .from('profiles')
        .select('total_earnings')
        .eq('id', user.id)
        .single();

    const total = profile?.total_earnings || 0;

    // 3. Calculate Last 30 Days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const lastMonth = allLogs
        .filter(l => new Date(l.created_at) >= thirtyDaysAgo)
        .reduce((sum, l) => sum + Number(l.amount), 0);

    // 4. Calculate Breakdown
    const sources = {};
    allLogs.forEach(l => {
        sources[l.source] = (sources[l.source] || 0) + Number(l.amount);
    });

    const breakdown = Object.keys(sources).map(key => ({
        label: key,
        amount: sources[key],
        percent: total > 0 ? Math.round((sources[key] / total) * 100) : 0,
        color: key === 'Brand Deal' ? '#2f8bff' : key === 'Ad Revenue' ? '#00E676' : '#FFD700'
    }));

    return {
        total,
        lastMonth,
        logs: allLogs.map(l => ({
            ...l,
            date: new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        })),
        breakdown
    };
};

/**
 * Get user brand interactions (Real-time)
 */



export async function getMyBrandInteractions(options = {}) {
    const { limit = 20, offset = 0 } = options;
    const user = await getCurrentUser();
    if (!user) return [];

    // Fetch posts where seen_by_brand is NOT null
    const { data, error } = await supabase
        .from('posts')
        .select('id, brand_name, text_content, media_url, seen_by_brand, seen_by_brand_at, created_at')
        .eq('user_id', user.id)
        .not('seen_by_brand', 'is', null)
        .order('seen_by_brand_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("Error fetching brand interactions:", error);
        return [];
    }

    return data;
};

/**
 * Get analytics summary for partner program
 */



export async function getPartnerStats() {
    const user = await getCurrentUser();
    if (!user) return { verifiedCount: 0, interactionCount: 0, streakWeeks: 0, tier: 'None' };

    const { data, error } = await supabase
        .from('profiles')
        .select('rqs_score, lifetime_interactions, current_streak_weeks, partner_program_tier')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching partner stats:', error);
        return { verifiedCount: 0, interactionCount: 0, streakWeeks: 0, tier: 'None' };
    }

    // Return mapped data
    // verifiedCount is legacy for UI compatibility, mapped to streak for now or just 0
    return {
        verifiedCount: 0,
        interactionCount: data.lifetime_interactions || 0,
        streakWeeks: data.current_streak_weeks || 0,
        tier: data.partner_program_tier || 'None'
    };
};

/**
 * Track a post share for analytics and partner program
 */



export async function getPartnerStatus() {
    const user = await getCurrentUser();
    if (!user) return 'none';

    // 1. Check profile status
    const { data: profile } = await supabase
        .from('profiles')
        .select('partner_application_status')
        .eq('id', user.id)
        .maybeSingle();

    if (profile?.partner_application_status) {
        return profile.partner_application_status;
    }

    // 2. Fallback to partner_applications table
    const { data: app } = await supabase
        .from('partner_applications')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

    return app?.status || 'none';
};

/**
 * Get full partner application record including rejection reason & form fields
 * @param {string} [userId] - Optional user ID
 * @returns {Promise<Object|null>}
 */
export async function getPartnerApplication(userId) {
    const user = userId ? { id: userId } : await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('partner_applications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) {
        console.warn('Could not fetch partner application:', error);
        return null;
    }

    return data;
}

/**
 * Apply for Partner Program
 */



export async function applyForPartner() {
    const { data, error } = await supabase
        .rpc('apply_for_partner_program');

    if (error) throw error;
    return data; // 'success', 'already_pending', etc.
};

/**
 * Request Withdrawal
 * @param {number} amount - Amount to withdraw (₹100-₹3000)
 * @param {string} method - Payment method ('upi' or 'bank')
 * @returns {Promise} Withdrawal request result
 */



export async function requestWithdrawal(amount, method) {
    const { data, error } = await supabase.rpc('handle_withdrawal_request', {
        p_amount: amount,
        p_method: method
    });

    if (error) {
        console.error('🔴 Withdrawal Error:', error);
        throw new Error(error.message || 'Failed to submit withdrawal request');
    }

    if (data && data.error) {
        throw new Error(data.error);
    }

    return data;
};

/**
 * Submit Partner Application
 * Upserts partner application data and updates profile status
 * @param {Object} formData - Application form data
 * @returns {Promise} Submission result
 */
export async function submitPartnerApplication(formData) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Upsert partner application, explicitly resetting rejection_reason
    const { error: appError } = await supabase
        .from('partner_applications')
        .upsert({
            user_id: user.id,
            legal_name: formData.legal_name,
            permanent_email: formData.permanent_email,
            id_number: formData.id_number,
            id_document_url: formData.id_document_url,
            bank_account_no: formData.bank_account_no,
            bank_ifsc: formData.bank_ifsc,
            bank_holder_name: formData.bank_holder_name,
            upi_id: formData.upi_id,
            status: 'pending',
            rejection_reason: null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (appError) throw appError;

    // 2. Update profile status
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ partner_application_status: 'pending' })
        .eq('id', user.id);

    if (profileError) {
        console.error('Failed to update profile partner status:', profileError);
    }

    return 'success';
}

/**
 * Upload partner ID document to Supabase Storage
 * @param {File} file - The ID document file
 * @returns {Promise<string>} Public URL of the uploaded document
 */
export async function uploadPartnerDocument(file) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `id-documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('partner-id-docs')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('partner-id-docs')
        .getPublicUrl(filePath);

    return publicUrl;
}

/**
 * Fetch legal name from partner application (used in PDF statement)
 * @param {string} userId - The user's ID
 * @returns {Promise<string|null>} Legal name or null
 */
export async function fetchLegalName(userId) {
    const { data, error } = await supabase
        .from('partner_applications')
        .select('legal_name')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.warn('Could not fetch legal name:', error);
        return null;
    }

    return data?.legal_name || null;
}
