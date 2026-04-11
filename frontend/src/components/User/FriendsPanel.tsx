import { useState } from "react"
import type { Friend, FriendRequest } from "../../api/friendship.api"

const PRESENCE_CONFIG = {
  online: { dot: "bg-emerald-400", label: "Online", text: "text-emerald-400" },
  recently_seen: { dot: "bg-amber-400", label: "Recently seen", text: "text-amber-400" },
  offline: { dot: "bg-slate-600", label: "Offline", text: "text-slate-500" },
}

type Props = {
  onClose: () => void
  onViewProfile: (userId: string) => void
  friends: Friend[]
  friendsLoading: boolean
  requests: FriendRequest[]
  requestsLoading: boolean
  onAcceptRequest: (userId: string) => Promise<void>
  onDeclineRequest: (userId: string) => Promise<void>
}

function FriendRow({ friend, onViewProfile }: { friend: Friend; onViewProfile: (id: string) => void }) {
  const presence = PRESENCE_CONFIG[friend.presence]

  return (
    <button
      onClick={() => onViewProfile(friend.id)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-all rounded-xl group text-left"
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
          {friend.avatar_url ? (
            <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-black text-emerald-400">
              {friend.username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${presence.dot}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-emerald-400 transition-colors">
          @{friend.username}
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-black uppercase tracking-widest ${presence.text}`}>
            {presence.label}
          </span>
          <span className="text-slate-700">·</span>
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
            LVL {friend.level}
          </span>
        </div>
      </div>

      <svg className="w-3 h-3 text-slate-700 group-hover:text-slate-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

export default function FriendsPanel({
  onClose,
  onViewProfile,
  friends,
  friendsLoading,
  requests,
  requestsLoading,
  onAcceptRequest,
  onDeclineRequest,
}: Props) {
  const [exiting, setExiting] = useState(false)
  const [tab, setTab] = useState<"friends" | "requests">("friends")

  const handleClose = () => {
    setExiting(true)
    setTimeout(onClose, 250)
  }

  const panelClass = exiting
    ? "translate-x-full"
    : "animate-in slide-in-from-right duration-300"

  const online = friends.filter((f) => f.presence === "online")
  const recentlySeen = friends.filter((f) => f.presence === "recently_seen")
  const offline = friends.filter((f) => f.presence === "offline")

  return (
    <div className={`absolute inset-0 z-[200] bg-slate-950 text-white transition-transform duration-250 ${panelClass} flex flex-col`}>
      <div className="px-6 pt-[env(safe-area-inset-top)] flex-shrink-0">
        <div className="mt-4 flex items-center justify-between">
          <button onClick={handleClose} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network</span>
            <span className="text-sm font-black text-white uppercase tracking-tight">Operatives</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4 mb-2">
          <button
            onClick={() => setTab("friends")}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              tab === "friends"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            Allies ({friends.length})
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border relative ${
              tab === "requests"
                ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            Requests
            {requests.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sky-500 text-[8px] font-black text-white flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[env(safe-area-inset-bottom)]">
        {tab === "friends" && (
          <>
            {friendsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <p className="text-slate-600 font-black uppercase tracking-widest text-xs text-center">No allies yet</p>
                <p className="text-slate-700 text-[10px] text-center">Find operatives on the map and send them a request</p>
              </div>
            ) : (
              <div className="py-2">
                {online.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest px-4 mb-1">Online — {online.length}</p>
                    {online.map((f) => <FriendRow key={f.id} friend={f} onViewProfile={onViewProfile} />)}
                  </div>
                )}
                {recentlySeen.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest px-4 mb-1">Recently Seen — {recentlySeen.length}</p>
                    {recentlySeen.map((f) => <FriendRow key={f.id} friend={f} onViewProfile={onViewProfile} />)}
                  </div>
                )}
                {offline.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-4 mb-1">Offline — {offline.length}</p>
                    {offline.map((f) => <FriendRow key={f.id} friend={f} onViewProfile={onViewProfile} />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {tab === "requests" && (
          <>
            {requestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-slate-600 font-black uppercase tracking-widest text-xs text-center">No pending requests</p>
              </div>
            ) : (
              <div className="py-2 flex flex-col gap-2">
                {requests.map((req) => (
                  <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {req.avatar_url ? (
                        <img src={req.avatar_url} alt={req.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-black text-sky-400">
                          {req.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white uppercase tracking-tight truncate">@{req.username}</p>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">LVL {req.level}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => onAcceptRequest(req.sender_id)}
                        className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeclineRequest(req.sender_id)}
                        className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}