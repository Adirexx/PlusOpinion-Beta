/**
 * notificationsService.js
 *
 * Comprehensive, industry-ready notification service for PlusOpinion SPA.
 * Covers every notification category:
 *   Social       — comments, replies, agrees, mentions, comment likes
 *   Lifecycle    — post created, deleted, removed
 *   Welcome      — new user welcome, welcome-back for returning users
 *   Engagement   — first-post encouragement, profile completion reminder
 *   RQS          — score updates, milestone achievements (10/25/50/75/90/100)
 *   Partner      — progress updates, eligibility alert, tier upgrades
 *   Brand        — brand viewed post, brand marked insight
 *   Security     — password changed, new device login
 *   System       — report submitted, admin announcement, profile verified
 *
 * All functions are safe to call fire-and-forget (use .catch() on callers).
 * Each uses the send_notification SECURITY DEFINER RPC so they work
 * for any recipient regardless of caller's RLS user context.
 */

import { supabase } from '../supabaseClient.js'
import { createNotification } from './notifications.js'

// ─────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────

async function getPostContext(postId) {
    const { data } = await supabase
        .from('posts')
        .select('id, user_id, text_content, product_name, item_name, brand_name, category, media_url, media_type')
        .eq('id', postId)
        .maybeSingle()
    return data
}

async function hasReceived(userId, type) {
    const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', type)
        .limit(1)
    return !!(data && data.length > 0)
}

async function getLastOfType(userId, type) {
    const { data } = await supabase
        .from('notifications')
        .select('created_at')
        .eq('user_id', userId)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(1)
    return data?.[0] || null
}

function daysSince(isoTimestamp) {
    return Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 86_400_000)
}

// ─────────────────────────────────────────────────────────
// WELCOME & ONBOARDING
// ─────────────────────────────────────────────────────────

export async function sendWelcomeNotification(userId, userName) {
    try {
        const alreadySent = await hasReceived(userId, 'welcome')
        if (alreadySent) return

        await createNotification({
            user_id: userId,
            type: 'welcome',
            title: `Welcome to PlusOpinion, ${userName}! 👋`,
            message: 'Start sharing your honest opinions and build your reputation. Your voice matters here.',
            metadata: { action_type: 'onboarding' },
            action_url: '/',
            icon: 'Sparkles',
            category: 'system',
            priority: 'normal'
        })
    } catch (err) {
        console.error('[Notify] sendWelcomeNotification:', err)
    }
}

export async function sendWelcomeBackNotification(userId, userName, lastLoginAt) {
    try {
        if (!lastLoginAt) return
        const away = daysSince(lastLoginAt)
        if (away < 3) return

        const last = await getLastOfType(userId, 'welcome_back')
        if (last && daysSince(last.created_at) < 7) return

        let timeMsg
        if (away < 7)       timeMsg = `${away} day${away !== 1 ? 's' : ''} ago`
        else if (away < 30) timeMsg = `${Math.floor(away / 7)} week${Math.floor(away / 7) !== 1 ? 's' : ''} ago`
        else                timeMsg = `${Math.floor(away / 30)} month${Math.floor(away / 30) !== 1 ? 's' : ''} ago`

        await createNotification({
            user_id: userId,
            type: 'welcome_back',
            title: `Welcome back, ${userName}! 👋`,
            message: `You last logged in ${timeMsg}. Check out what's new on your feed!`,
            metadata: { last_login: lastLoginAt, days_since: away },
            action_url: '/',
            icon: 'Home',
            category: 'system',
            priority: 'normal'
        })
    } catch (err) {
        console.error('[Notify] sendWelcomeBackNotification:', err)
    }
}

export async function sendFirstPostEncouragement(userId, userName) {
    try {
        const alreadySent = await hasReceived(userId, 'first_post_encouragement')
        if (alreadySent) return

        const { data: profile } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', userId)
            .maybeSingle()
        if (!profile) return

        const hoursSinceSignup = (Date.now() - new Date(profile.created_at).getTime()) / 3_600_000
        if (hoursSinceSignup < 24) return

        const { count } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_deleted', false)
        if (count > 0) return

        await createNotification({
            user_id: userId,
            type: 'first_post_encouragement',
            title: `${userName}, share your first opinion! 💡`,
            message: 'Post your first review today — your voice boosts your RQS and gets seen by brands.',
            metadata: { action_type: 'encouragement', is_first_post: true },
            action_url: '/',
            icon: 'Edit',
            category: 'engagement',
            priority: 'normal'
        })
    } catch (err) {
        console.error('[Notify] sendFirstPostEncouragement:', err)
    }
}

// ─────────────────────────────────────────────────────────
// PROFILE & RQS ENGAGEMENT SUGGESTIONS
// ─────────────────────────────────────────────────────────

export async function checkRQSScoreSuggestions(userId, profile) {
    try {
        if (!userId) return

        let p = profile
        if (!p || !p.id) {
            const { data } = await supabase
                .from('profiles')
                .select('id, bio, avatar_url, banner_url, location, created_at, rqs_score, rqs_verification_score, rqs_consistency_score')
                .eq('id', userId)
                .maybeSingle()
            p = data
        }
        if (!p) return

        // 1. Strict Cooldown check: only suggest every 2-3 days
        const lastIncomplete = await getLastOfType(userId, 'profile_incomplete')
        if (lastIncomplete && daysSince(lastIncomplete.created_at) < 3) return

        const lastSuggestion = await getLastOfType(userId, 'rqs_suggestion')
        if (lastSuggestion && daysSince(lastSuggestion.created_at) < 3) return

        const lastPartnerIntro = await getLastOfType(userId, 'rqs_partner_intro')
        if (lastPartnerIntro && daysSince(lastPartnerIntro.created_at) < 3) return

        // 2. New user partner & RQS awareness
        const hasIntro = await hasReceived(userId, 'rqs_partner_intro')
        const isNewUser = !p.created_at || daysSince(p.created_at) <= 3
        if (!hasIntro && isNewUser) {
            await createNotification({
                user_id: userId,
                type: 'rqs_partner_intro',
                title: 'Build Your RQS & Unlock Partner Earnings ⚡',
                message: 'Your Reputation Quality Score (RQS) unlocks Creator Partner status and brand deals. Aim for 75+ RQS by sharing authentic opinions.',
                metadata: { category: 'rqs_suggestion', target_rqs: 75, signal: '(Setting up)' },
                action_url: '/myspace?view=rqs',
                icon: 'Zap',
                category: 'achievement',
                priority: 'normal'
            })
            return
        }

        // 3. Profile completion check:
        // Calculated score boost based on missing fields:
        // Avatar = +3 RQS, Bio = +2 RQS, Banner = +2 RQS, Location = +1 RQS
        const missing = []
        let potentialBoost = 0

        const hasAvatar = p.avatar_url && !p.avatar_url.includes('dicebear') && !p.avatar_url.includes('placeholder')
        if (!hasAvatar) {
            missing.push({ key: 'avatar', label: 'profile photo', boost: 3 })
            potentialBoost += 3
        }
        if (!p.bio || p.bio.trim().length === 0) {
            missing.push({ key: 'bio', label: 'bio', boost: 2 })
            potentialBoost += 2
        }
        if (!p.banner_url) {
            missing.push({ key: 'banner', label: 'cover banner', boost: 2 })
            potentialBoost += 2
        }
        if (!p.location) {
            missing.push({ key: 'location', label: 'location', boost: 1 })
            potentialBoost += 1
        }

        if (potentialBoost > 0) {
            const labels = missing.map(m => m.label).join(', ')
            await createNotification({
                user_id: userId,
                type: 'profile_incomplete',
                title: `Complete Your Profile: +${potentialBoost} RQS Boost 📝`,
                message: `Add your ${labels} to increase your RQS score by +${potentialBoost} points and strengthen your account trust.`,
                metadata: {
                    missing_fields: missing.map(m => m.key),
                    potential_boost: potentialBoost,
                    category: 'rqs_suggestion'
                },
                action_url: '/settings',
                icon: 'User',
                category: 'system',
                priority: 'normal'
            })
            return
        }

        // 4. Other RQS Dimensions suggestions (Verification / Consistency)
        const verificationScore = p.rqs_verification_score ?? p.rqs_verification ?? 0
        const consistencyScore = p.rqs_consistency_score ?? p.rqs_consistency ?? 0

        if (verificationScore < 20) {
            await createNotification({
                user_id: userId,
                type: 'rqs_suggestion',
                title: 'Boost Your Verification RQS (+10 to +40 pts) 🛡️',
                message: 'Include product photos and purchase proof in your opinions to verify your experience and rapidly gain RQS points.',
                metadata: { category: 'rqs_suggestion', dimension: 'verification' },
                action_url: '/feed',
                icon: 'Shield',
                category: 'achievement',
                priority: 'normal'
            })
            return
        }

        if (consistencyScore < 10) {
            await createNotification({
                user_id: userId,
                type: 'rqs_suggestion',
                title: 'Strengthen Your Consistency RQS (+20 pts) 📈',
                message: 'Engage with reviews and leave helpful comments regularly to build your consistency streak and raise your RQS.',
                metadata: { category: 'rqs_suggestion', dimension: 'consistency' },
                action_url: '/feed',
                icon: 'Zap',
                category: 'achievement',
                priority: 'normal'
            })
            return
        }
    } catch (err) {
        console.error('[Notify] checkRQSScoreSuggestions:', err)
    }
}

// Backward-compatible alias
export const checkProfileCompletion = (userId) => checkRQSScoreSuggestions(userId)

export async function sendProfileVerifiedNotification(userId) {
    try {
        await createNotification({
            user_id: userId,
            type: 'profile_verified',
            title: 'Profile Verified! 🎉',
            message: 'Congratulations! Your profile has been officially verified.',
            metadata: { badge: 'verified' },
            action_url: '/myspace',
            icon: 'Shield',
            category: 'system',
            priority: 'high'
        })
    } catch (err) {
        console.error('[Notify] sendProfileVerifiedNotification:', err)
    }
}

// ─────────────────────────────────────────────────────────
// RQS MILESTONES
// ─────────────────────────────────────────────────────────

const RQS_MILESTONES = [10, 25, 50, 75, 90, 100]
const RQS_MILESTONE_COPY = {
    10:  { emoji: '🌟', message: "You're off to a great start! Keep sharing opinions to grow your score." },
    25:  { emoji: '🚀', message: 'Strong momentum! Your reputation is growing fast.' },
    50:  { emoji: '🎯', message: "Halfway there! Your opinions are making real impact." },
    75:  { emoji: '⭐', message: "Excellent progress! You're building a strong reputation." },
    90:  { emoji: '🔥', message: "Almost perfect! Just 10 more points to reach the top tier." },
    100: { emoji: '🏆', message: "Perfect score! You've achieved the highest reputation rating." },
}

export async function checkRQSMilestones(userId, newScore, oldScore = 0) {
    try {
        for (const milestone of RQS_MILESTONES) {
            if (newScore >= milestone && oldScore < milestone) {
                const notifType = `rqs_milestone_${milestone}`
                const alreadySent = await hasReceived(userId, notifType)
                if (alreadySent) continue

                const copy = RQS_MILESTONE_COPY[milestone] || { emoji: '📊', message: 'Great work on building your reputation!' }
                await createNotification({
                    user_id: userId,
                    type: notifType,
                    title: `RQS Milestone: ${milestone} Points! ${copy.emoji}`,
                    message: copy.message,
                    metadata: {
                        milestone,
                        current_score: newScore,
                        next_milestone: RQS_MILESTONES.find(m => m > milestone) || 100
                    },
                    action_url: '/myspace?view=rqs',
                    icon: 'Award',
                    category: 'achievement',
                    priority: 'high'
                })
            }
        }
    } catch (err) {
        console.error('[Notify] checkRQSMilestones:', err)
    }
}

export async function sendRQSUpdateNotification(userId, oldScore, newScore) {
    try {
        if (newScore - oldScore < 2) return
        await createNotification({
            user_id: userId,
            type: 'rqs_updated',
            title: 'RQS Score Updated ⬆️',
            message: `Your Reputation Quality Score increased from ${oldScore} to ${newScore}. Keep it up!`,
            metadata: { old_score: oldScore, new_score: newScore, delta: newScore - oldScore },
            action_url: '/myspace?view=rqs',
            icon: 'Zap',
            category: 'achievement',
            priority: 'normal'
        })
    } catch (err) {
        console.error('[Notify] sendRQSUpdateNotification:', err)
    }
}

// ─────────────────────────────────────────────────────────
// PARTNER PROGRAM (Using standard signals: Setting up, Emerging, So close, Eligible)
// ─────────────────────────────────────────────────────────

export const getPartnerSignal = (progress) => {
    if (progress <= 50) return '(Setting up)';
    if (progress <= 90) return '(Emerging)';
    if (progress < 100) return '(So close)';
    return '(Eligible)';
};

export async function sendPartnerEligibilityNotification(userId) {
    try {
        const alreadySent = await hasReceived(userId, 'partner_eligible')
        if (alreadySent) return

        await createNotification({
            user_id: userId,
            type: 'partner_eligible',
            title: 'Partner Program: (Eligible) 🎊',
            message: "You've met all criteria for the PlusOpinion Creator Partner Program. Tap to view your benefits and apply!",
            metadata: { program: 'partner', signal: '(Eligible)' },
            action_url: '/myspace?view=monetization',
            icon: 'Award',
            category: 'monetization',
            priority: 'high'
        })
    } catch (err) {
        console.error('[Notify] sendPartnerEligibilityNotification:', err)
    }
}

export async function sendPartnerProgressNotification(userId, stats) {
    try {
        const rqsProgress    = Math.min(((stats.rqsScore || 0) / 75) * 100, 100)
        const intProgress    = Math.min(((stats.lifetimeInteractions || 0) / 500) * 100, 100)
        const streakProgress = Math.min(((stats.streakWeeks || 0) / 4) * 100, 100)
        const total          = Math.round((rqsProgress + intProgress + streakProgress) / 3)

        const signal = getPartnerSignal(total)

        if (total >= 100) {
            await sendPartnerEligibilityNotification(userId)
            return
        }

        // Throttle check: Don't notify if sent in last 3 days
        const last = await getLastOfType(userId, 'partner_progress')
        if (last && daysSince(last.created_at) < 3) return

        let title, message
        if (signal === '(So close)') {
            title = 'Partner Program: (So close) 🔥'
            message = `You're at ${total}% progress! Almost there — keep up your interactions and posting streak to qualify.`
        } else if (signal === '(Emerging)') {
            title = 'Partner Program: (Emerging) 🚀'
            message = `Great momentum! You're at ${total}% progress towards creator monetization. Keep sharing quality opinions.`
        } else {
            // (Setting up)
            title = 'Partner Program: (Setting up) ⚡'
            message = `Start your creator journey: Aim for 75 RQS and build your interaction streak to qualify.`
        }

        await createNotification({
            user_id: userId,
            type: 'partner_progress',
            title,
            message,
            metadata: {
                signal,
                total,
                rqs_progress: Math.round(rqsProgress),
                interaction_progress: Math.round(intProgress),
                streak_progress: Math.round(streakProgress)
            },
            action_url: '/myspace?view=monetization',
            icon: 'Award',
            category: 'monetization',
            priority: 'normal'
        })
    } catch (err) {
        console.error('[Notify] sendPartnerProgressNotification:', err)
    }
}

export async function sendPartnerTierUpgradeNotification(userId, signalOrTier) {
    // Deprecated bronze/gold in favor of existing signals: (Setting up), (Emerging), (So close), (Eligible)
    try {
        const signal = signalOrTier?.startsWith('(') ? signalOrTier : `(${signalOrTier})`
        await createNotification({
            user_id: userId,
            type: 'partner_progress',
            title: `Partner Program Signal: ${signal} 📈`,
            message: `Your Creator Partner progress updated to ${signal}. Tap to check your status.`,
            metadata: { signal },
            action_url: '/myspace?view=monetization',
            icon: 'Award',
            category: 'monetization',
            priority: 'normal'
        })
    } catch (err) {
        console.error('[Notify] sendPartnerTierUpgradeNotification:', err)
    }
}

// ─────────────────────────────────────────────────────────
// BRAND NOTIFICATIONS
// ─────────────────────────────────────────────────────────

export async function sendBrandViewNotification(postId, userId, brandName) {
    try {
        const post = await getPostContext(postId)
        const productName = post?.product_name || post?.item_name || 'your post'

        await createNotification({
            user_id: userId,
            type: 'brand_view',
            title: `${brandName} viewed your review 👀`,
            message: `Your review of '${productName}' caught the brand's attention.`,
            related_post_id: postId,
            metadata: { brand_name: brandName, product_name: productName },
            action_url: `/?post=${postId}`,
            icon: 'Eye',
            category: 'brand',
            priority: 'normal'
        })
    } catch (err) {
        console.error('[Notify] sendBrandViewNotification:', err)
    }
}

export async function sendBrandInsightNotification(postId, userId, brandName) {
    try {
        const post = await getPostContext(postId)
        const productName = post?.product_name || post?.item_name || 'your review'

        await createNotification({
            user_id: userId,
            type: 'brand_insight',
            title: `${brandName} marked your review as Helpful! 🏅`,
            message: `Your feedback on '${productName}' was recognized by the brand team.`,
            related_post_id: postId,
            metadata: { brand_name: brandName, product_name: productName },
            action_url: `/?post=${postId}`,
            icon: 'Award',
            category: 'brand',
            priority: 'high'
        })
    } catch (err) {
        console.error('[Notify] sendBrandInsightNotification:', err)
    }
}

// ─────────────────────────────────────────────────────────
// POST LIFECYCLE
// ─────────────────────────────────────────────────────────

export async function sendPostCreatedNotification(postId, userId) {
    try {
        const post = await getPostContext(postId)
        if (!post) return

        await createNotification({
            user_id: userId,
            type: 'post_created',
            title: 'Opinion Published ✅',
            message: 'Your opinion has been published. Share it to get more visibility!',
            related_post_id: postId,
            metadata: {
                post_preview: post.text_content?.substring(0, 80),
                product_name: post.product_name || post.item_name,
                category: post.category
            },
            action_url: `/?post=${postId}`,
            icon: 'CheckCircle',
            category: 'system',
            priority: 'normal'
        })
    } catch (err) {
        console.error('[Notify] sendPostCreatedNotification:', err)
    }
}

export async function sendPostDeletedNotification(userId, postPreview) {
    try {
        await createNotification({
            user_id: userId,
            type: 'post_deleted',
            title: 'Post Deleted',
            message: 'Your post has been deleted successfully.',
            metadata: { post_preview: postPreview?.substring(0, 80) },
            icon: 'Trash',
            category: 'system',
            priority: 'normal'
        })
    } catch (err) {
        console.error('[Notify] sendPostDeletedNotification:', err)
    }
}

export async function sendPostRemovedByAdminNotification(userId, postId, reason) {
    try {
        await createNotification({
            user_id: userId,
            type: 'post_removed',
            title: 'Post Removed by Moderation',
            message: `Your post was removed: ${reason || 'Violated community guidelines'}`,
            related_post_id: postId,
            metadata: { reason },
            icon: 'Shield',
            category: 'system',
            priority: 'high'
        })
    } catch (err) {
        console.error('[Notify] sendPostRemovedByAdminNotification:', err)
    }
}

// ─────────────────────────────────────────────────────────
// SECURITY & SYSTEM
// ─────────────────────────────────────────────────────────

export async function sendPasswordChangedNotification(userId) {
    try {
        await createNotification({
            user_id: userId,
            type: 'password_changed',
            title: 'Password Changed 🔐',
            message: "Your password was updated successfully. If this wasn't you, contact support immediately.",
            metadata: { timestamp: new Date().toISOString() },
            action_url: '/settings',
            icon: 'Lock',
            category: 'security',
            priority: 'high'
        })
    } catch (err) {
        console.error('[Notify] sendPasswordChangedNotification:', err)
    }
}

export async function sendPinChangedNotification(userId) {
    try {
        await createNotification({
            user_id: userId,
            type: 'pin_changed',
            title: 'Security PIN Updated 🔒',
            message: 'Your 6-digit Inbox security PIN was updated successfully.',
            metadata: { timestamp: new Date().toISOString() },
            action_url: '/settings',
            icon: 'Shield',
            category: 'security',
            priority: 'high'
        })
    } catch (err) {
        console.error('[Notify] sendPinChangedNotification:', err)
    }
}


export async function sendNewDeviceLoginNotification(userId, deviceInfo) {
    try {
        const device = deviceInfo?.platform || 'a new device'
        await createNotification({
            user_id: userId,
            type: 'new_device_login',
            title: 'New Login Detected 🔔',
            message: `Your account was accessed from ${device}. If this wasn't you, secure your account now.`,
            metadata: { device, timestamp: new Date().toISOString() },
            action_url: '/settings',
            icon: 'LogIn',
            category: 'security',
            priority: 'high'
        })
    } catch (err) {
        console.error('[Notify] sendNewDeviceLoginNotification:', err)
    }
}

export async function sendReportSubmittedNotification(userId, reportType, targetId, reason) {
    try {
        const label = reportType === 'post' ? 'post' : reportType === 'user' ? 'user' : 'content'
        const refId = `REF-${Date.now().toString(36).toUpperCase()}`

        await createNotification({
            user_id: userId,
            type: 'report_submitted',
            title: 'Report Received ✓',
            message: `Your report on this ${label} has been received. We'll review it within 24 hours. (Ref: ${refId})`,
            metadata: { report_type: reportType, target_id: targetId, reason, reference_id: refId },
            icon: 'Shield',
            category: 'system',
            priority: 'normal'
        })
    } catch (err) {
        console.error('[Notify] sendReportSubmittedNotification:', err)
    }
}

export async function sendAdminAnnouncementNotification(userId, title, message, priority = 'normal') {
    try {
        await createNotification({
            user_id: userId,
            type: 'admin_announcement',
            title,
            message,
            metadata: { source: 'admin', timestamp: new Date().toISOString() },
            icon: 'Megaphone',
            category: 'system',
            priority
        })
    } catch (err) {
        console.error('[Notify] sendAdminAnnouncementNotification:', err)
    }
}

// ─────────────────────────────────────────────────────────
// LOGIN ORCHESTRATOR
// Call this once from AuthContext after profile is loaded on SIGNED_IN.
// Fires welcome / welcome-back / engagement checks non-blockingly.
// ─────────────────────────────────────────────────────────

export async function runLoginNotificationChecks(profile, isNewUser = false) {
    if (!profile?.id) return

    const userId   = profile.id
    const userName = profile.full_name || profile.username || 'there'

    try {
        if (isNewUser) {
            await sendWelcomeNotification(userId, userName)
        } else if (profile.last_login_at) {
            await sendWelcomeBackNotification(userId, userName, profile.last_login_at)
        }

        // Non-blocking engagement checks
        sendFirstPostEncouragement(userId, userName).catch(() => {})
        checkRQSScoreSuggestions(userId, profile).catch(() => {})

        if (typeof profile.rqs_score === 'number' && profile.rqs_score > 0) {
            checkRQSMilestones(userId, profile.rqs_score).catch(() => {})
        }

        if (profile.lifetime_interactions !== undefined) {
            sendPartnerProgressNotification(userId, {
                rqsScore: profile.rqs_score || 0,
                lifetimeInteractions: profile.lifetime_interactions || 0,
                streakWeeks: profile.current_streak_weeks || 0
            }).catch(() => {})
        }
    } catch (err) {
        console.error('[Notify] runLoginNotificationChecks:', err)
    }
}
