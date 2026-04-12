import FriendButton from '../User/FriendButton'
import type { Friend, FriendRequest, SentRequest } from '../../api/friendship.api'

type Props = {
  username: string
  userId: string
  position: { x: number; y: number }
  friends: Friend[]
  friendRequests: FriendRequest[]
  sentRequests: SentRequest[]
  onSentRequest?: (req: SentRequest) => void
  onAccepted?: (userId: string) => void
  onDeclined?: (userId: string) => void
  onViewProfile: () => void
  onClose: () => void
}

export default function PlayerContextMenu({ username, userId, position, friends, friendRequests, sentRequests, onSentRequest, onAccepted, onDeclined, onViewProfile, onClose }: Props) {
  return (
    <>
      <div className="absolute inset-0 z-[150]" onClick={onClose} />
      <div
        className="absolute z-[151] animate-in fade-in zoom-in-95 duration-150"
        style={{ left: position.x + 30, top: position.y }}
      >
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-xl min-w-[180px]">
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operative</p>
            <p className="text-sm font-black text-sky-400 uppercase tracking-tight">@{username}</p>
          </div>
          <div className="p-1.5 flex flex-col gap-0.5">
            <div className="px-1.5 pt-1 pb-0.5">
              <FriendButton
                userId={userId}
                friends={friends}
                friendRequests={friendRequests}
                sentRequests={sentRequests}
                onSentRequest={onSentRequest}
                onAccepted={onAccepted}
                onDeclined={onDeclined}
                onAction={onClose}
              />
            </div>
            <button
              onClick={onViewProfile}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-all text-left group"
            >
              <div className="p-1.5 bg-slate-800 group-hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors">
                <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-[10px] font-black text-slate-300 group-hover:text-white uppercase tracking-widest transition-colors">
                View Profile
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}