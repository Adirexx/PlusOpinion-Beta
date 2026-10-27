import React, { useState } from "react";
import BottomNav from "../components/nav/BottomNav";
import NavItem from "../components/nav/NavItem";
import AuthModal from "../components/modals/AuthModal";
import ShareModal from "../components/modals/ShareModal";
import ReportModal from "../components/modals/ReportModal";
import OpinionModal from "../components/modals/OpinionModal";
import LogoutModal from "../components/modals/LogoutModal";
import ImageViewer from "../components/modals/ImageViewer";
import MenuDrawer from "../components/overlays/MenuDrawer";
import MenuItem from "../components/overlays/MenuItem";
import ProductCard from "../components/feed/ProductCard";
import CommentItem from "../components/feed/CommentItem";
import ReplyItem from "../components/feed/ReplyItem";
import MentionAutocomplete from "../components/feed/MentionAutocomplete";
import ReviewerCircle from "../components/feed/ReviewerCircle";
import SkeletonPost from "../components/feed/SkeletonPost";
import SmartMedia from "../components/feed/SmartMedia";
import Icon from "../components/ui/Icon";
import { Icons } from "../components/ui/Icons";
import Avatar from "../components/ui/Avatar";
import Toast from "../components/ui/Toast";
import InboxHost from "../components/inbox/InboxHost";

export default function KitchenSink() {
    const [activeTab, setActiveTab] = useState("home");

    const dummyProduct = { name: "Test Product", brand: "Test Brand", image: "https://via.placeholder.com/150", rqs: 85 };
    const dummyComment = { id: "11111111-1111-1111-1111-111111111111", user: "John Doe", user_id: "u1", time: "2h", text: "This is a great product!", avatar: "https://via.placeholder.com/150", replies: [] };
    const dummyReply = { id: "22222222-2222-2222-2222-222222222222", user: "Jane", time: "1h", text: "I agree", avatar: "https://via.placeholder.com/150" };
    const dummyPost = { id: "33333333-3333-3333-3333-333333333333", title: "Test Post", content: "Test content", username: "testuser" };

    return (
        <div className="bg-black text-white min-h-screen p-8 pb-32">
            <h1 className="text-3xl font-bold mb-8 text-neon">Kitchen Sink</h1>
            
            <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4 text-gray-400 border-b border-gray-800 pb-2">UI Components</h2>
                <div className="flex flex-wrap gap-4 items-center">
                    <Icon icon="Home" size={32} className="text-white" />
                    <Avatar src="https://via.placeholder.com/150" className="w-12 h-12" />
                    <Toast message="Test Toast" type="success" onClose={() => {}} />
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4 text-gray-400 border-b border-gray-800 pb-2">Feed Components</h2>
                <div className="flex flex-wrap gap-8">
                    <ProductCard product={dummyProduct} />
                    <div className="w-80 border border-gray-800 rounded p-4">
                        <CommentItem comment={dummyComment} />
                        <ReplyItem reply={dummyReply} />
                    </div>
                    <div className="w-80">
                        <SkeletonPost />
                    </div>
                    <div className="flex flex-col items-center">
                        <ReviewerCircle user={{ handle: "testuser", avatar: "https://via.placeholder.com/150", rqs: 95 }} isEnd={false} />
                    </div>
                    <div className="w-80">
                        <SmartMedia src="https://via.placeholder.com/300x200" />
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4 text-gray-400 border-b border-gray-800 pb-2">Navigation & Overlays</h2>
                <div className="flex flex-wrap gap-8">
                    <div className="bg-gray-900 rounded p-2 flex gap-4 w-64">
                        <NavItem icon="Home" label="Home" isActive={true} onClick={() => {}} badge={0} />
                        <NavItem icon="Bell" label="Inbox" isActive={false} onClick={() => {}} badge={5} />
                    </div>
                    <div className="w-64 bg-gray-900 p-4 rounded">
                        <MenuItem icon="User" label="Profile" onClick={() => {}} />
                    </div>
                </div>
            </section>

            <section className="mb-12 relative h-48 border border-gray-800 rounded">
                <h2 className="text-xl font-semibold mb-4 text-gray-400 border-b border-gray-800 pb-2 absolute top-2 left-2 z-50">Mention Autocomplete</h2>
                <MentionAutocomplete query="test" onSelect={() => {}} coords={{top: 50, left: 20}} />
            </section>

            <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4 text-gray-400 border-b border-gray-800 pb-2">Modals (Hidden by Default)</h2>
                <p className="text-sm text-gray-500">Rendered in DOM but mostly hidden or absolute positioned.</p>
                <AuthModal isVisible={false} onClose={() => {}} />
                <LogoutModal isVisible={false} onCancel={() => {}} onConfirm={() => {}} />
                <ShareModal isVisible={false} post={dummyPost} onClose={() => {}} />
                <ReportModal isVisible={false} post={dummyPost} onClose={() => {}} />
                <OpinionModal isVisible={false} onClose={() => {}} />
                <ImageViewer images={[]} currentIndex={0} onClose={() => {}} />
                <LensOverlay isOpen={false} onClose={() => {}} />
                <MenuDrawer isOpen={false} onClose={() => {}} userProfile={{full_name: "Test", username: "test", avatar_url: "", banner_url: ""}} />
            </section>

            <InboxHost />

            <BottomNav 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isGuest={false} 
                onAuthRequired={() => {}} 
                unreadInboxCount={2} 
                unreadNotifCount={5} 
                setUnreadInboxCount={() => {}} 
            />
        </div>
    );
}