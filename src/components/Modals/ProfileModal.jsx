import { useState, useRef } from 'react'
import { X, Camera, Ghost, Mail, User, Shield, Key, Trash2, ArrowLeft, Download, Eye, EyeOff, Lock } from 'lucide-react'
import API from '../../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useConfig } from '../../context/ConfigContext'
import { compressImage } from '../../utils/imageUtils'
import ConfirmModal from './ConfirmModal'

const ProfileModal = ({ onClose }) => {
  const { user, updateProfile, logout, destroyAccount } = useAuth()
  const { config, validateFile, handleKeyRestriction } = useConfig()
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [profilePic, setProfilePic] = useState(user.profilePic || '')
  const [previewFile, setPreviewFile] = useState(null)
  const [fileToUpload, setFileToUpload] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const fileRef = useRef(null)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    const { valid, error } = validateFile(selectedFile, 'avatar')
    if (!valid) {
      toast.error(error)
      return
    }

    // Compress image before setting for upload
    // Note: We use 512px for profile avatars as they don't need high res
    compressImage(selectedFile, { maxWidth: 512, maxHeight: 512, quality: 0.8 }).then((compressedFile) => {
      setFileToUpload(compressedFile)
      const reader = new FileReader()
      reader.onload = (ev) => setPreviewFile(ev.target.result)
      reader.readAsDataURL(compressedFile)
    })
  }

  const uploadToCloudinary = async () => {
    try {
      const { data: uploadData } = await API.post('/files/upload-url', {
        folder: 'hashchat/profiles',
      })
      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('api_key', uploadData.apiKey)
      formData.append('timestamp', uploadData.timestamp)
      formData.append('signature', uploadData.signature)
      formData.append('folder', uploadData.folder)

      const response = await fetch(uploadData.uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error("Cloudinary profile upload error:", errData);
        throw new Error(errData.error?.message || "Cloudinary upload failed");
      }
      const result = await response.json()
      console.log("Profile upload result:", result);
      return result.secure_url
    } catch (err) {
      console.error('Profile photo upload error detailed:', err);
      toast.error(`Photo upload failed: ${err.message || 'Settings missing'}`);
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || username.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }

    setLoading(true)
    try {
      let finalPicUrl = profilePic
      
      if (fileToUpload) {
        toast('Uploading photo...', { icon: '⏳' })
        const url = await uploadToCloudinary()
        if (url) finalPicUrl = url
      }

      const { data } = await API.put('/users/me', {
        username: username,
        email: !user.isGuest ? email : undefined,
        password: !user.isGuest && password ? password : undefined,
        currentPassword: !user.isGuest && (email !== user.email || password) ? currentPassword : undefined,
        profilePic: finalPicUrl,
      })

      updateProfile(data.user)
      toast.success('Profile updated successfully')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      await destroyAccount()
      onClose()
    } catch (err) {
      // handled
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose()
      }}>
        <div className="modal-content animate-slide-up max-w-[420px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Edit Profile</h2>
            <button onClick={onClose} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div 
                  className="w-24 h-24 rounded-full bg-dark-800 border-2 border-dark-600 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-500 transition-all duration-300"
                  onClick={() => fileRef.current?.click()}
                >
                  {previewFile ? (
                    <img src={previewFile} alt="Preview" className="w-full h-full object-cover" />
                  ) : user.profilePic ? (
                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : user.isGuest ? (
                    <Ghost className="w-10 h-10 text-dark-400" />
                  ) : (
                    <Camera className="w-8 h-8 text-dark-400" />
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-dark-900 hover:bg-primary-500 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <input
                type="file"
                ref={fileRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
              
              {config?.limits?.avatarSize && (
                <div className="mt-3 text-center px-4">
                  <p className="text-[10px] text-dark-500 uppercase font-bold tracking-widest leading-normal">
                    Max size: {Math.max(1, Math.round(config.limits.avatarSize / (1024 * 1024)))}MB <br />
                    Allowed types: {config.limits.avatarTypes.map(t => t.split('/')[1]).join(', ')}
                  </p>
                </div>
              )}
            </div>

            <div className="w-full mb-6">
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => handleKeyRestriction(e, 'username')}
                  className="input-field pl-10"
                  placeholder="Username"
                  minLength={3}
                  maxLength={30}
                  required
                />
              </div>
              <p className="text-[10px] text-dark-500 mt-1 uppercase font-bold tracking-wider ml-1">Alphabets, numbers, underscores, dots only</p>
            </div>

            {!user.isGuest && (
              <>
                <div className="w-full mb-4">
                  <label className="block text-sm font-medium text-dark-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="Email"
                    required
                  />
                  <p className="text-[10px] text-primary-500/70 mt-1 italic">Note: Verification required on change.</p>
                </div>

                <div className="w-full mb-4">
                  <label className="block text-sm font-medium text-dark-300 mb-1">
                    New Password (optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pr-10"
                      placeholder="Leave blank to keep current"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {(email !== user.email || password) && (
                  <div className="w-full mb-6 p-4 bg-primary-500/5 border border-primary-500/20 rounded-xl animate-fade-in">
                    <label className="block text-sm font-medium text-primary-400 mb-1">
                      Confirm Changes
                    </label>
                    <p className="text-[10px] text-dark-400 mb-3">
                      Enter your current password to save sensitive changes.
                    </p>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="input-field border-primary-500/30 focus:border-primary-500 bg-primary-500/5 pr-10"
                        placeholder="Current Password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500/40 hover:text-primary-400"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>

            <div className="w-full mt-8 pt-6 border-t border-dark-800">
              <h3 className="text-sm font-semibold text-red-500 mb-2">Danger Zone</h3>
              <p className="text-xs text-dark-500 mb-4">
                Permanently delete your account and all your data. This action is not reversible.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium"
              >
                Delete My Account
              </button>
            </div>
          </form>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Account Permanently"
          message="Are you absolutely sure? This will delete your account and all rooms you created. This action cannot be undone."
          danger={true}
          onConfirm={handleDeleteAccount}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}

export default ProfileModal
