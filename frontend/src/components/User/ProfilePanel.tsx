import { useState, useRef } from "react"
import { useAuthStore } from "../../stores/auth.store"
import { useProfile } from "../../hooks/users/useProfile"
import { usersApi } from "../../api/users.api"
import type { OwnProfile } from "../../api/users.api"
import type { FriendRequest, Friend, SentRequest } from "../../api/friendship.api"
import FriendButton from './FriendButton'

const ROLE_CONFIG = {
  admin: { label: "ADMIN", color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10" },
  moderator: { label: "MODERATOR", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  reporter: { label: "OPERATIVE", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
}

function formatJoinDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }).toUpperCase()
}

type Props = {
  userId?: string
  onClose: () => void
  friends: Friend[]
  friendRequests: FriendRequest[]
  sentRequests: SentRequest[]
  onSentRequest?: (req: SentRequest) => void
}

export default function ProfilePanel({ userId, onClose, friends, friendRequests, sentRequests, onSentRequest }: Props) {
  const currentUser = useAuthStore((state) => state.user)
  const [exiting, setExiting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [bioInput, setBioInput] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isOwnProfile = !userId || userId === currentUser?.userId
  const { profile, loading, error, setProfile } = useProfile(isOwnProfile ? "me" : userId!)

  const handleClose = () => {
    setExiting(true)
    setTimeout(onClose, 250)
  }

  const handleEditStart = () => {
    setBioInput(profile?.bio ?? "")
    setAvatarPreview(null)
    setAvatarFile(null)
    setSaveError(null)
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setSaveError(null)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!currentUser) return
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await usersApi.updateMe({
        bio: bioInput,
        avatar: avatarFile ?? undefined,
      })
      setProfile(updated as OwnProfile)
      setIsEditing(false)
    } catch {
      setSaveError("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const panelClass = exiting
    ? "translate-x-full"
    : "animate-in slide-in-from-right duration-300"

  if (loading) return (
    <div className={`absolute inset-0 z-[200] bg-slate-950 text-white transition-transform duration-250 ${panelClass} flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 uppercase tracking-widest font-black">Retrieving Intel...</p>
      </div>
    </div>
  )

  if (error || !profile) return (
    <div className={`absolute inset-0 z-[200] bg-slate-950 text-white transition-transform duration-250 ${panelClass} flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <p className="text-red-400 font-black uppercase tracking-widest text-sm">Operative Not Found</p>
        <button onClick={handleClose} className="text-slate-500 text-xs uppercase tracking-widest font-black hover:text-white transition-colors">
          ← Return
        </button>
      </div>
    </div>
  )

  const role = ROLE_CONFIG[profile.role as keyof typeof ROLE_CONFIG]
  const displayAvatar = avatarPreview ?? profile.avatarUrl

  return (
    <div className={`absolute inset-0 z-[200] bg-slate-950 text-white transition-transform duration-250 ${panelClass} overflow-y-auto`}>
      {/* Header */}
      <div className="px-6 pt-[env(safe-area-inset-top)]">
        <div className="mt-4 flex items-center justify-between">
          <button onClick={handleClose} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </button>

          {isOwnProfile && !isEditing && (
            <button onClick={handleEditStart} className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors">
              Edit
            </button>
          )}
          {isOwnProfile && isEditing && (
            <div className="flex items-center gap-4">
              <button onClick={handleEditCancel} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-12 pt-6 max-w-lg mx-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-md" />
            <div className="relative w-24 h-24 rounded-2xl border-2 border-emerald-500/40 bg-slate-800 overflow-hidden flex items-center justify-center">
              {displayAvatar ? (
                <img src={displayAvatar} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-emerald-400">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {isEditing && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-slate-900/70 flex items-center justify-center"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </>
            )}
          </div>

          <div className="text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Operative Identity</p>
            <h1 className="text-2xl font-black uppercase tracking-tight">@{profile.username}</h1>
          </div>
        </div>

        {/* Friend button — only on other users' profiles */}
        {!isOwnProfile && (
          <div className="mb-6">
            <FriendButton
              userId={userId!}
              friends={friends}
              friendRequests={friendRequests}
              sentRequests={sentRequests}
              onSentRequest={onSentRequest}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-900 border border-slate-800 border-l-2 border-l-emerald-500 rounded-xl p-4">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Rank</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-400 tabular-nums">{profile.level}</span>
              <span className="text-[9px] font-black text-slate-500 uppercase">LVL</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 border-l-2 border-l-amber-500 rounded-xl p-4">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Points</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-400 tabular-nums">{profile.points.toLocaleString()}</span>
              <span className="text-[9px] font-black text-slate-500 uppercase">PTS</span>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${role.border} ${role.bg} mb-6`}>
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
          <span className={`text-[10px] font-black tracking-widest uppercase ${role.color}`}>{role.label}</span>
        </div>

        {/* Bio */}
        <div className="bg-slate-900 border border-slate-800 border-l-2 border-l-slate-600 rounded-xl p-4 mb-6">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Bio</p>
          {isEditing ? (
            <>
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="Write something about yourself..."
                className="w-full bg-transparent text-sm text-slate-200 leading-relaxed font-medium resize-none outline-none placeholder:text-slate-600"
              />
              <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-2 text-right">
                {bioInput.length}/300
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {profile.bio ?? "No bio yet."}
            </p>
          )}
        </div>

        {saveError && (
          <p className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center mb-4">
            {saveError}
          </p>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-600 uppercase border-t border-slate-800 pt-4">
          <span>Operative since</span>
          <span className="text-slate-400">{formatJoinDate(profile.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}