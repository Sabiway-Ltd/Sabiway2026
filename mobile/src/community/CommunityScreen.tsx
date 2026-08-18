import { useCallback, useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import type { AuthSession } from "../auth/types";
import { colors } from "../design/tokens";
import {
  addComment,
  addReply,
  bookmarkPost,
  createPost,
  deletePost,
  getComments,
  getPosts,
  getReplies,
  likePost,
  reportPost,
  repostPost,
  unbookmarkPost,
  unlikePost,
  updatePost,
  type ForumMediaAsset,
} from "./api";
import type { ForumComment, ForumPost, ForumReply } from "./types";

type Props = { session: AuthSession; onSignOut: () => void };
const messageFrom = (error: unknown) => error instanceof Error ? error.message : "Please try again.";

export function CommunityScreen({ session, onSignOut }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 24, 720);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedQuery, setFeedQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState("");
  const [postImage, setPostImage] = useState<ForumMediaAsset | null>(null);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImage, setEditImage] = useState<ForumMediaAsset | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<ForumMediaAsset | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState<ForumMediaAsset | null>(null);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setLoadError(null);
    try { setPosts(await getPosts(session.access)); }
    catch (error) { setLoadError(messageFrom(error)); }
    finally { setLoading(false); setRefreshing(false); }
  }, [session.access]);

  useEffect(() => { void load(); }, [load]);

  const pickImage = async (onPick: (asset: ForumMediaAsset) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Photo access needed", "Allow photo access to attach an image to SabiForum.");
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.mimeType && !asset.mimeType.startsWith("image/")) return Alert.alert("Unsupported file", "Please choose an image file.");
    onPick({ uri: asset.uri, name: asset.fileName, mimeType: asset.mimeType });
  };

  const publish = async () => {
    const trimmed = content.trim();
    if ((!trimmed && !postImage) || posting) return;
    setPosting(true);
    try {
      const post = await createPost(session.access, trimmed, postImage);
      setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
      setContent(""); setPostImage(null); setComposerOpen(false);
    } catch (error) { Alert.alert("Post not published", messageFrom(error)); }
    finally { setPosting(false); }
  };

  const startEdit = (post: ForumPost) => { setEditingPost(post); setEditContent(post.content); setEditImage(null); };
  const saveEdit = async () => {
    if (!editingPost || (!editContent.trim() && !editImage) || savingEdit) return;
    setSavingEdit(true);
    try {
      const updated = await updatePost(session.access, editingPost.id, editContent.trim(), editImage);
      setPosts((current) => current.map((post) => post.id === updated.id ? updated : post));
      setEditingPost(null); setEditImage(null);
    } catch (error) { Alert.alert("Post not updated", messageFrom(error)); }
    finally { setSavingEdit(false); }
  };

  const removePost = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try { await deletePost(session.access, id); setPosts((current) => current.filter((post) => post.id !== id)); if (selectedPost === id) setSelectedPost(null); }
    catch (error) { Alert.alert("Post not deleted", messageFrom(error)); }
    finally { setDeletingId(null); }
  };

  const confirmDelete = (post: ForumPost) => Alert.alert("Delete post?", "This removes the post and its discussion from SabiForum.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => void removePost(post.id) }]);

  const toggleLike = async (post: ForumPost) => {
    const nextLiked = !post.is_liked;
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, is_liked: nextLiked, likes_count: Math.max(0, item.likes_count + (nextLiked ? 1 : -1)) } : item));
    try { if (nextLiked) await likePost(session.access, post.id); else await unlikePost(session.access, post.id); }
    catch { await load(true); }
  };

  const toggleBookmark = async (post: ForumPost) => {
    const nextBookmarked = !post.is_bookmarked;
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, is_bookmarked: nextBookmarked } : item));
    try { if (nextBookmarked) await bookmarkPost(session.access, post.id); else await unbookmarkPost(session.access, post.id); }
    catch { await load(true); }
  };

  const openComments = async (post: ForumPost) => {
    setSelectedPost(post.id); setSelectedComment(null); setReplies([]); setComments([]); setCommentImage(null); setReplyImage(null); setCommentsError(null); setCommentsLoading(true);
    try { setComments(await getComments(session.access, post.id)); }
    catch (error) { setCommentsError(messageFrom(error)); }
    finally { setCommentsLoading(false); }
  };

  const submitComment = async () => {
    if (!selectedPost || (!commentText.trim() && !commentImage)) return;
    try {
      const comment = await addComment(session.access, selectedPost, commentText.trim(), commentImage);
      setComments((current) => [comment, ...current]); setCommentText(""); setCommentImage(null);
      setPosts((current) => current.map((post) => post.id === selectedPost ? { ...post, comments_count: post.comments_count + 1 } : post));
    } catch (error) { Alert.alert("Comment not posted", messageFrom(error)); }
  };

  const openReplies = async (comment: ForumComment) => {
    setSelectedComment(comment.id); setReplies([]); setReplyImage(null); setRepliesError(null); setRepliesLoading(true);
    try { setReplies(await getReplies(session.access, comment.id)); }
    catch (error) { setRepliesError(messageFrom(error)); }
    finally { setRepliesLoading(false); }
  };

  const submitReply = async () => {
    if (!selectedComment || (!replyText.trim() && !replyImage)) return;
    try {
      const reply = await addReply(session.access, selectedComment, replyText.trim(), undefined, replyImage);
      setReplies((current) => [...current, reply]); setReplyText(""); setReplyImage(null);
      setComments((current) => current.map((comment) => comment.id === selectedComment ? { ...comment, reply_count: (comment.reply_count ?? 0) + 1 } : comment));
    } catch (error) { Alert.alert("Reply not posted", messageFrom(error)); }
  };

  const submitReport = async () => {
    if (!reportTarget || !reportReason.trim() || reporting) return;
    setReporting(true);
    try { await reportPost(session.access, reportTarget, reportReason.trim()); setReportTarget(null); setReportReason(""); Alert.alert("Report submitted", "The SabiWay moderation team can now review this post."); }
    catch (error) { Alert.alert("Report not submitted", messageFrom(error)); }
    finally { setReporting(false); }
  };

  const visiblePosts = useMemo(() => {
    const q = feedQuery.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((post) => `${post.author.full_name} ${post.author.username} ${post.content}`.toLowerCase().includes(q));
  }, [feedQuery, posts]);

  return (
    <View style={styles.screen}>
      <View style={[styles.shell, { width: contentWidth }]}>
        <FlatList
          data={loadError ? [] : visiblePosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />}
          ListHeaderComponent={(
            <>
              <View style={styles.hero}>
                <View style={styles.heroRow}><Text style={styles.heroTitle}>Community</Text><Pressable accessibilityRole="button" onPress={onSignOut} style={styles.headerIcon}><Text style={styles.headerIconText}>↗</Text></Pressable></View>
                <View style={styles.searchRow}><Text style={styles.searchGlyph}>⌕</Text><TextInput value={feedQuery} onChangeText={setFeedQuery} placeholder="Search" placeholderTextColor="#6C7A73" style={styles.searchInput} /><Text style={styles.micGlyph}>⌕</Text></View>
              </View>
              <View style={styles.quickComposer}><View style={styles.avatar}><Text style={styles.avatarText}>{session.user.full_name.slice(0, 1).toUpperCase()}</Text></View><Pressable onPress={() => setComposerOpen(true)} style={styles.quickComposerInput}><Text style={styles.quickComposerText}>Share something with SabiForum…</Text></Pressable><Pressable onPress={() => setComposerOpen(true)} style={styles.postPill}><Text style={styles.postPillText}>Create Post ＋</Text></Pressable></View>
              {loading ? <ActivityIndicator accessibilityLabel="Loading SabiForum" color={colors.brand} size="large" style={styles.loader} /> : null}
              {loadError ? <ErrorCard title="Could not load SabiForum" message={loadError} retry={() => void load()} /> : null}
              {!loading && !loadError && visiblePosts.length === 0 ? <Text style={styles.empty}>No posts match this view yet.</Text> : null}
            </>
          )}
          renderItem={({ item }) => {
            const isOwner = item.author.user_id === session.user.id;
            return <View style={styles.postCard}>
              <View style={styles.authorRow}><View style={styles.avatar}><Text style={styles.avatarText}>{item.author.full_name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.authorCopy}><Text style={styles.author}>{item.author.full_name}</Text><Text style={styles.handle}>{item.author.username} · {new Date(item.created_at).toLocaleDateString("en-GB")}</Text></View>{isOwner ? <Pressable onPress={() => startEdit(item)}><Text style={styles.more}>⋮</Text></Pressable> : <Pressable onPress={() => { setReportTarget(item.id); setReportReason(""); }}><Text style={styles.more}>⋮</Text></Pressable>}</View>
              <Text style={styles.postText}>{item.content}</Text>
              {item.image ? <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" accessibilityLabel="Post image" /> : null}
              <View style={styles.actions}><Action icon="♡" label={String(item.likes_count)} onPress={() => void toggleLike(item)} active={item.is_liked} /><Action icon="▱" label={String(item.comments_count)} onPress={() => void openComments(item)} /><Action icon="↻" label={String(item.reposts_count)} onPress={async () => { try { await repostPost(session.access, item.id); await load(true); } catch (error) { Alert.alert("Could not repost", messageFrom(error)); } }} /><Action icon={item.is_bookmarked ? "▣" : "▢"} label="" onPress={() => void toggleBookmark(item)} active={item.is_bookmarked} /></View>
              {isOwner ? <View style={styles.ownerRow}><Pressable onPress={() => startEdit(item)}><Text style={styles.ownerAction}>Edit</Text></Pressable><Pressable disabled={deletingId === item.id} onPress={() => confirmDelete(item)}><Text style={styles.ownerDanger}>{deletingId === item.id ? "Deleting…" : "Delete"}</Text></Pressable></View> : null}
              {selectedPost === item.id ? <CommentsPanel comments={comments} commentsLoading={commentsLoading} commentsError={commentsError} commentText={commentText} setCommentText={setCommentText} commentImage={commentImage} setCommentImage={setCommentImage} pickImage={pickImage} submitComment={submitComment} selectedComment={selectedComment} replies={replies} repliesLoading={repliesLoading} repliesError={repliesError} replyText={replyText} setReplyText={setReplyText} replyImage={replyImage} setReplyImage={setReplyImage} openReplies={openReplies} submitReply={submitReply} /> : null}
            </View>;
          }}
        />
      </View>

      {composerOpen ? <View style={styles.sheetWrap} accessibilityViewIsModal><View style={[styles.sheet, { width: contentWidth }]}><View style={styles.sheetHeader}><Pressable onPress={() => { setComposerOpen(false); setPostImage(null); }}><Text style={styles.sheetClose}>×</Text></Pressable><Text style={styles.sheetTitle}>Create Post</Text><View style={{ width: 28 }} /></View><View style={styles.composerAuthor}><View style={styles.avatar}><Text style={styles.avatarText}>{session.user.full_name.slice(0, 1).toUpperCase()}</Text></View><Text style={styles.author}>{session.user.full_name}</Text></View><TextInput multiline value={content} onChangeText={setContent} placeholder="What do you want to share?" placeholderTextColor="#8A8A8A" style={styles.createInput} />{postImage ? <Image source={{ uri: postImage.uri }} style={styles.previewImage} accessibilityLabel="Selected post image" /> : null}<View style={styles.createFooter}><Pressable onPress={() => void pickImage(setPostImage)} style={styles.mediaButton}><Text style={styles.mediaButtonText}>▧</Text></Pressable>{postImage ? <Pressable onPress={() => setPostImage(null)} style={styles.mediaButton}><Text style={styles.mediaButtonText}>×</Text></Pressable> : null}<View style={{ flex: 1 }} /><Pressable disabled={(!content.trim() && !postImage) || posting} onPress={() => void publish()} style={[styles.publishButton, ((!content.trim() && !postImage) || posting) && styles.disabled]}><Text style={styles.publishText}>{posting ? "Posting…" : "Post"}</Text></Pressable></View></View></View> : null}

      {editingPost ? <View style={styles.sheetWrap} accessibilityViewIsModal><View style={[styles.sheet, { width: contentWidth }]}><Text style={styles.sheetTitle}>Edit post</Text><TextInput multiline value={editContent} onChangeText={setEditContent} style={styles.createInput} />{editImage ? <Image source={{ uri: editImage.uri }} style={styles.previewImage} /> : editingPost.image ? <Image source={{ uri: editingPost.image }} style={styles.previewImage} /> : null}<View style={styles.sheetActions}><Pressable disabled={savingEdit} onPress={() => void pickImage(setEditImage)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Choose image</Text></Pressable><Pressable disabled={savingEdit} onPress={() => { setEditingPost(null); setEditImage(null); }} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancel</Text></Pressable><Pressable disabled={(!editContent.trim() && !editImage) || savingEdit} onPress={() => void saveEdit()} style={[styles.publishButton, ((!editContent.trim() && !editImage) || savingEdit) && styles.disabled]}><Text style={styles.publishText}>{savingEdit ? "Saving…" : "Save"}</Text></Pressable></View></View></View> : null}

      {reportTarget ? <View style={styles.sheetWrap} accessibilityViewIsModal><View style={[styles.sheet, { width: contentWidth }]}><Text style={styles.sheetTitle}>Report post</Text><Text style={styles.sheetCopy}>Tell the moderation team what needs review. Do not include sensitive personal information.</Text><TextInput multiline value={reportReason} onChangeText={setReportReason} placeholder="Why should this post be reviewed?" placeholderTextColor="#8A8A8A" style={styles.createInput} /><View style={styles.sheetActions}><Pressable disabled={reporting} onPress={() => { setReportTarget(null); setReportReason(""); }} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancel</Text></Pressable><Pressable disabled={!reportReason.trim() || reporting} onPress={() => void submitReport()} style={[styles.publishButton, (!reportReason.trim() || reporting) && styles.disabled]}><Text style={styles.publishText}>{reporting ? "Submitting…" : "Submit"}</Text></Pressable></View></View></View> : null}
    </View>
  );
}

function CommentsPanel({ comments, commentsLoading, commentsError, commentText, setCommentText, commentImage, setCommentImage, pickImage, submitComment, selectedComment, replies, repliesLoading, repliesError, replyText, setReplyText, replyImage, setReplyImage, openReplies, submitReply }: {
  comments: ForumComment[]; commentsLoading: boolean; commentsError: string | null; commentText: string; setCommentText: (value: string) => void; commentImage: ForumMediaAsset | null; setCommentImage: (value: ForumMediaAsset | null) => void; pickImage: (onPick: (asset: ForumMediaAsset) => void) => Promise<void>; submitComment: () => Promise<void>; selectedComment: string | null; replies: ForumReply[]; repliesLoading: boolean; repliesError: string | null; replyText: string; setReplyText: (value: string) => void; replyImage: ForumMediaAsset | null; setReplyImage: (value: ForumMediaAsset | null) => void; openReplies: (comment: ForumComment) => Promise<void>; submitReply: () => Promise<void>;
}) {
  return <View style={styles.commentsPanel}><View style={styles.commentComposer}><TextInput value={commentText} onChangeText={setCommentText} placeholder="Leave a comment" placeholderTextColor="#8A8A8A" style={styles.commentInput} /><Pressable onPress={() => void pickImage(setCommentImage)} style={styles.commentIcon}><Text style={styles.commentIconText}>▧</Text></Pressable><Pressable disabled={!commentText.trim() && !commentImage} onPress={() => void submitComment()} style={styles.commentSend}><Text style={styles.commentSendText}>➤</Text></Pressable></View>{commentImage ? <Image source={{ uri: commentImage.uri }} style={styles.smallPreview} /> : null}{commentsLoading ? <ActivityIndicator color={colors.brand} /> : null}{commentsError ? <InlineError message={commentsError} /> : null}{comments.map((comment) => <View key={comment.id} style={styles.comment}><Text style={styles.commentAuthor}>{comment.user.full_name}</Text><Text style={styles.commentText}>{comment.content}</Text>{comment.image ? <Image source={{ uri: comment.image }} style={styles.commentImage} /> : null}<Pressable onPress={() => void openReplies(comment)}><Text style={styles.replyLink}>{comment.reply_count ?? 0} replies · Reply</Text></Pressable>{selectedComment === comment.id ? <View style={styles.repliesPanel}>{repliesLoading ? <ActivityIndicator color={colors.brand} /> : null}{repliesError ? <InlineError message={repliesError} /> : null}{replies.map((reply) => <View key={reply.id} style={styles.reply}><Text style={styles.commentAuthor}>{reply.user.full_name}</Text><Text style={styles.commentText}>{reply.content}</Text>{reply.image ? <Image source={{ uri: reply.image }} style={styles.commentImage} /> : null}</View>)}<TextInput value={replyText} onChangeText={setReplyText} placeholder="Write a reply" placeholderTextColor="#8A8A8A" style={styles.commentInput} />{replyImage ? <Image source={{ uri: replyImage.uri }} style={styles.smallPreview} /> : null}<View style={styles.sheetActions}><Pressable onPress={() => void pickImage(setReplyImage)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Image</Text></Pressable>{replyImage ? <Pressable onPress={() => setReplyImage(null)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Remove</Text></Pressable> : null}<Pressable disabled={!replyText.trim() && !replyImage} onPress={() => void submitReply()} style={styles.publishButton}><Text style={styles.publishText}>Send</Text></Pressable></View></View> : null}</View>)}</View>;
}

function Action({ icon, label, onPress, active = false }: { icon: string; label: string; onPress: () => void; active?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}><Text style={[styles.actionIcon, active && styles.actionIconActive]}>{icon}</Text>{label ? <Text style={[styles.actionLabel, active && styles.actionIconActive]}>{label}</Text> : null}</Pressable>;
}
function ErrorCard({ title, message, retry }: { title: string; message: string; retry: () => void }) { return <View style={styles.errorCard}><Text style={styles.errorTitle}>{title}</Text><Text style={styles.errorText}>{message}</Text><Pressable onPress={retry}><Text style={styles.retryText}>Try again</Text></Pressable></View>; }
function InlineError({ message }: { message: string }) { return <Text style={styles.errorText}>{message}</Text>; }

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", backgroundColor: "#F6F6F6" },
  shell: { flex: 1 },
  list: { paddingBottom: 34 },
  hero: { backgroundColor: colors.brand, paddingHorizontal: 15, paddingTop: 16, paddingBottom: 18, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  heroRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,.15)", alignItems: "center", justifyContent: "center" },
  headerIconText: { color: "#FFFFFF", fontWeight: "900" },
  searchRow: { minHeight: 44, marginTop: 12, backgroundColor: "#FFFFFF", borderRadius: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 11 },
  searchGlyph: { color: "#4A4A4A", fontSize: 18, marginRight: 7 },
  searchInput: { flex: 1, minHeight: 44, color: "#222222" },
  micGlyph: { color: colors.brand, fontWeight: "900" },
  quickComposer: { margin: 12, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#E5E5E5" },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#DDF6E9", alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.brand, fontWeight: "900" },
  quickComposerInput: { flex: 1 },
  quickComposerText: { color: "#888888", fontSize: 11 },
  postPill: { minHeight: 36, borderRadius: 18, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  postPillText: { color: "#FFFFFF", fontWeight: "900", fontSize: 9 },
  loader: { marginVertical: 28 },
  empty: { color: "#888888", textAlign: "center", padding: 30 },
  postCard: { backgroundColor: "#FFFFFF", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E8E8E8", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 9, gap: 10 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  authorCopy: { flex: 1 },
  author: { color: "#222222", fontWeight: "900", fontSize: 12 },
  handle: { color: "#8A8A8A", fontSize: 9, marginTop: 2 },
  more: { color: "#555555", fontSize: 19, paddingHorizontal: 8 },
  postText: { color: "#333333", fontSize: 12, lineHeight: 18 },
  postImage: { width: "100%", height: 250, borderRadius: 7, backgroundColor: "#EEEEEE" },
  actions: { flexDirection: "row", alignItems: "center", gap: 22, borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingTop: 9 },
  action: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 32 },
  actionIcon: { color: "#555555", fontSize: 15 },
  actionIconActive: { color: colors.brand },
  actionLabel: { color: "#777777", fontSize: 9, fontWeight: "700" },
  ownerRow: { flexDirection: "row", gap: 14 },
  ownerAction: { color: colors.brand, fontSize: 10, fontWeight: "800" },
  ownerDanger: { color: "#B42318", fontSize: 10, fontWeight: "800" },
  commentsPanel: { borderTopWidth: 1, borderTopColor: "#EEEEEE", paddingTop: 10, gap: 9 },
  commentComposer: { flexDirection: "row", alignItems: "center", gap: 6 },
  commentInput: { flex: 1, minHeight: 40, borderRadius: 20, borderWidth: 1, borderColor: "#E4E4E4", paddingHorizontal: 12, color: "#222222", backgroundColor: "#FAFAFA" },
  commentIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  commentIconText: { color: "#777777", fontSize: 16 },
  commentSend: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  commentSendText: { color: "#FFFFFF", fontWeight: "900" },
  comment: { backgroundColor: "#F8F8F8", borderRadius: 10, padding: 9, gap: 4 },
  commentAuthor: { color: "#333333", fontSize: 10, fontWeight: "900" },
  commentText: { color: "#555555", fontSize: 10, lineHeight: 16 },
  replyLink: { color: colors.brand, fontSize: 9, fontWeight: "800", marginTop: 3 },
  repliesPanel: { marginLeft: 10, gap: 7, marginTop: 7 },
  reply: { borderLeftWidth: 2, borderLeftColor: "#D7EDE2", paddingLeft: 8, gap: 3 },
  commentImage: { width: "100%", height: 120, borderRadius: 7 },
  smallPreview: { width: 100, height: 72, borderRadius: 7 },
  sheetWrap: { position: "absolute", inset: 0, zIndex: 20, backgroundColor: "rgba(0,0,0,.28)", alignItems: "center", justifyContent: "flex-end" },
  sheet: { maxHeight: "92%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, gap: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetClose: { fontSize: 25, color: "#333333" },
  sheetTitle: { color: "#222222", fontSize: 16, fontWeight: "900" },
  sheetCopy: { color: "#777777", fontSize: 11, lineHeight: 17 },
  composerAuthor: { flexDirection: "row", alignItems: "center", gap: 9 },
  createInput: { minHeight: 120, textAlignVertical: "top", color: "#222222", fontSize: 13, lineHeight: 20, paddingVertical: 8 },
  previewImage: { width: "100%", height: 180, borderRadius: 8, backgroundColor: "#EEEEEE" },
  createFooter: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "#EEEEEE", paddingTop: 10 },
  mediaButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  mediaButtonText: { color: "#555555", fontSize: 18 },
  publishButton: { minHeight: 40, minWidth: 80, borderRadius: 20, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  publishText: { color: "#FFFFFF", fontWeight: "900", fontSize: 11 },
  sheetActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 },
  secondaryButton: { minHeight: 40, borderRadius: 20, borderWidth: 1, borderColor: "#D6D6D6", alignItems: "center", justifyContent: "center", paddingHorizontal: 13 },
  secondaryText: { color: "#555555", fontWeight: "800", fontSize: 10 },
  disabled: { opacity: 0.45 },
  errorCard: { margin: 12, padding: 12, borderRadius: 10, backgroundColor: "#FFF1F0" },
  errorTitle: { color: "#8F2119", fontWeight: "900" },
  errorText: { color: "#8F2119", fontSize: 10, marginTop: 4 },
  retryText: { color: "#8F2119", fontWeight: "900", marginTop: 6 },
});
