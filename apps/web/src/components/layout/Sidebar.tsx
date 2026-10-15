import Link from "next/link";
import { useState } from "react";
import {
    CircleHelp,
    Gamepad2,
    LayoutGrid,
    MessageSquare,
    MoreHorizontal,
    Settings,
    Sparkles,
    Trophy,
    Users,
    X,
} from "lucide-react";

export default function Sidebar() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="brand">
                <span className="brand-mark">♞</span>
                <span>Chess Arena</span>
                <button
                    className="close-nav"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation"
                >
                    <X />
                </button>
            </div>
            <nav className="nav-group" aria-label="Primary navigation">
                <p className="nav-label">Play</p>
                <Link className="nav-item active" href="/">
                    <Gamepad2 /> Play
                </Link>
                <Link className="nav-item" href="/puzzles">
                    <Sparkles /> Puzzles <span className="nav-count">12</span>
                </Link>
                <Link className="nav-item" href="/learn">
                    <LayoutGrid /> Learn
                </Link>
                <Link className="nav-item" href="/watch">
                    <Trophy /> Watch
                </Link>
                <p className="nav-label space-top">Social</p>
                <Link className="nav-item" href="/friends">
                    <Users /> Friends <span className="online-dot" />
                </Link>
                <Link className="nav-item" href="/messages">
                    <MessageSquare /> Messages
                </Link>
            </nav>
            <div className="sidebar-bottom">
                <Link className="nav-item" href="/settings">
                    <Settings /> Settings
                </Link>
                <Link className="nav-item" href="/help">
                    <CircleHelp /> Help center
                </Link>
                <div className="profile-mini">
                    <div className="avatar avatar-purple">SK</div>
                    <div>
                        <strong>skywalker</strong>
                        <span>1,842 rating</span>
                    </div>
                    <MoreHorizontal className="muted-icon" />
                </div>
            </div>
        </aside>
    );
}
