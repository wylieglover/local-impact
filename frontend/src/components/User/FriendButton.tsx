import { useFriendship } from '../../hooks/friendship/useFriendship'
import type { Friend, FriendRequest, SentRequest } from '../../api/friendship.api'

type Props = {
  userId: string
  friends: Friend[]
  friendRequests: FriendRequest[]
  sentRequests: SentRequest[]
  onAction?: () => void
}

export default function FriendButton({ userId, friends, friendRequests, sentRequests, onAction }: Props) {
  const { state, sendRequest, acceptRequest, removeFriend, error } = useFriendship(userId, friends, friendRequests, sentRequests)

  const handleSend = async () => { await sendRequest(); onAction?.() }
  const handleAccept = async () => { await acceptRequest(); onAction?.() }
  const handleRemove = async () => { await removeFriend(); onAction?.() }

  if (state === "loading") return null

  return (
    <div className="w-full flex flex-col gap-2">
      {error && (
        <p className="text-red-400 text-[9px] font-black uppercase tracking-widest text-center">
          {error}
        </p>
      )}

      {state === "none" && (
        <button
          onClick={handleSend}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add Operative
        </button>
      )}

      {state === "pending_sent" && (
        <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-500 text-[10px] font-black uppercase tracking-widest cursor-not-allowed opacity-60">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Request Sent
        </div>
      )}

      {state === "pending_received" && (
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            Accept
          </button>
          <button
            onClick={handleRemove}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Decline
          </button>
        </div>
      )}

      {state === "accepted" && (
        <button
          onClick={handleRemove}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
          </svg>
          Remove Operative
        </button>
      )}
    </div>
  )
}