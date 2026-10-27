import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useInbox } from '../../context/InboxContext'
import * as inboxCrypto from '../../lib/inbox/inboxCrypto'
import './E2EEModals.css'

export function E2EESetupModal() {
    const { user } = useAuth()
    const { setE2eeState, closeInbox } = useInbox()
    const [pin, setPin] = useState('')
    const [confirmPin, setConfirmPin] = useState('')
    const [step, setStep] = useState(1) // 1: pin, 2: confirm
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleNext = () => {
        if (pin.length !== 6) {
            setError('PIN must be exactly 6 digits')
            return
        }
        setError('')
        setStep(2)
    }

    const handleSubmit = async () => {
        if (pin !== confirmPin) {
            setError('PINs do not match')
            setStep(1)
            setPin('')
            setConfirmPin('')
            return
        }
        
        setError('')
        setLoading(true)
        try {
            await inboxCrypto.setupE2EE(user.id, pin)
            setE2eeState('ready')
        } catch (e) {
            console.error('[E2EE Setup]', e)
            setError('Failed to setup encryption. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="e2ee-modal-overlay">
            <div className="e2ee-modal">
                <div className="e2ee-modal-header">
                    <h3>Secure your chats</h3>
                    <button className="e2ee-modal-close" onClick={closeInbox}>✕</button>
                </div>
                
                <div className="e2ee-modal-content">
                    <p className="e2ee-desc">
                        PlusOpinion uses true End-to-End Encryption. Your messages are mathematically locked so that no one, not even us, can read them.
                    </p>
                    <p className="e2ee-desc">
                        Create a 6-digit Recovery PIN. This will securely backup your keys to the cloud so you can access your chats on other devices.
                    </p>
                    
                    <div className="e2ee-input-group">
                        <label>{step === 1 ? 'Enter new 6-digit PIN' : 'Confirm your PIN'}</label>
                        <input 
                            type="password" 
                            maxLength={6}
                            value={step === 1 ? pin : confirmPin}
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '')
                                if (step === 1) setPin(val)
                                else setConfirmPin(val)
                            }}
                            placeholder="••••••"
                            autoFocus
                        />
                    </div>
                    
                    {error && <div className="e2ee-error">{error}</div>}
                    
                    <button 
                        className="e2ee-btn-primary" 
                        onClick={step === 1 ? handleNext : handleSubmit}
                        disabled={loading || (step === 1 ? pin.length !== 6 : confirmPin.length !== 6)}
                    >
                        {loading ? 'Securing...' : (step === 1 ? 'Next' : 'Setup Encryption')}
                    </button>
                    
                    <div className="e2ee-footer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Your PIN never leaves your device.
                    </div>
                </div>
            </div>
        </div>
    )
}

export function E2EERecoveryModal() {
    const { user } = useAuth()
    const { setE2eeState, e2eeBackup, closeInbox } = useInbox()
    const [pin, setPin] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        if (pin.length !== 6) {
            setError('PIN must be exactly 6 digits')
            return
        }
        
        setError('')
        setLoading(true)
        try {
            const success = await inboxCrypto.recoverE2EE(
                user.id, 
                pin, 
                e2eeBackup.encryptedBlob, 
                e2eeBackup.iv, 
                e2eeBackup.salt
            )
            if (success) {
                setE2eeState('ready')
            } else {
                setError('Incorrect PIN. Please try again.')
                setPin('')
                setLoading(false)
            }
        } catch (e) {
            console.error('[E2EE Recovery]', e)
            setError('Failed to decrypt. Please try again later.')
            setLoading(false)
        }
    }

    return (
        <div className="e2ee-modal-overlay">
            <div className="e2ee-modal">
                <div className="e2ee-modal-header">
                    <h3>Restore Chat History</h3>
                    <button className="e2ee-modal-close" onClick={closeInbox}>✕</button>
                </div>
                
                <div className="e2ee-modal-content">
                    <div className="e2ee-lock-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2f8bff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    
                    <p className="e2ee-desc" style={{textAlign: 'center'}}>
                        Enter your 6-digit Recovery PIN to unlock your End-to-End Encrypted chat history.
                    </p>
                    
                    <div className="e2ee-input-group">
                        <input 
                            type="password" 
                            maxLength={6}
                            value={pin}
                            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            autoFocus
                            style={{textAlign: 'center', letterSpacing: '0.5em', fontSize: '20px'}}
                        />
                    </div>
                    
                    {error && <div className="e2ee-error" style={{textAlign: 'center'}}>{error}</div>}
                    
                    <button 
                        className="e2ee-btn-primary" 
                        onClick={handleSubmit}
                        disabled={loading || pin.length !== 6}
                    >
                        {loading ? 'Unlocking...' : 'Unlock Chats'}
                    </button>
                    
                    <button className="e2ee-btn-text" onClick={async () => {
                        const ok = window.appConfirm 
                            ? await window.appConfirm('Warning: This will permanently delete your old chat history keys and start fresh. Continue?', 'Reset Keys?', true)
                            : confirm('Warning: This will permanently delete your old chat history keys and start fresh. Continue?');
                        if (ok) {
                            setE2eeState('needs_setup')
                        }
                    }}>
                        Forgot PIN? Reset Keys
                    </button>
                </div>
            </div>
        </div>
    )
}
