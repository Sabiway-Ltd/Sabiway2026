import { useCallback, useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
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

type Props = {
  session: AuthSession;
  onSignOut: () => void;
};

const messageFrom = (error: unknown) => error instanceof Error ? error.message : "Please try again.";

export function CommunityScreen({ session, onSignOut }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 24, 720);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState<string | null>(null);

  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setLoadError(null);
    try {
      setPosts(await getPosts(session.access));
    } catch (error) {
      setLoadError(messageFrom(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.access]);

  useEffect(() => { void load(); }, [load]);

  const pickImage = async (onPick: (asset: ForumMediaAsset) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo access to attach an image to your SabiForum post.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.mimeType && !asset.mimeType.startsWith("image/")) {
      Alert.alert("Unsupported file", "Please choose an image file.");
      return;
    }
    onPick({ uri: asset.uri, name: asset.fileName, mimeType: asset.mimeType });
  };

  const publish = async () => {
    const trimmed = content.trim();
    if ((!trimmed && !postImage) || posting) return;
    setPosting(true);
    try {
      const post = await createPost(session.access, trimmed, postImage);
      setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
      setContent("");
      setPostImage(null);
    } catch (error) {
      Alert.alert("Post not published", messageFrom(error));
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (post: ForumPost) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditImage(null);
  };

  const saveEdit = async () => {
    if (!editingPost || (!editContent.trim() && !editImage) || savingEdit) return;
    setSavingEdit(true);
    try {
      const updated = await updatePost(session.access, editingPost.id, editContent.trim(), editImage);
      setPosts((current) => current.map((post) => post.id === updated.id ? updated : post));
      setEditingPost(null);
      setEditImage(null);
    } catch (error) {
      Alert.alert("Post not updated", messageFrom(error));
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = (post: ForumPost) => {
    Alert.alert("Delete post?", "This removes the post and its discussion from SabiForum.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void removePost(post.id),
      },
    ]);
  };

  const removePost = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deletePost(session.access, id);
      setPosts((current) => current.filter((post) => post.id !== id));
      if (selectedPost === id) setSelectedPost(null);
    } catch (error) {
      Alert.alert("Post not deleted", messageFrom(error));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleLike = async (post: ForumPost) => {
    const nextLiked = !post.is_liked;
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, is_liked: nextLiked, likes_count: Math.max(0, item.likes_count + (nextLiked ? 1 : -1)) } : item));
    try {
      if (nextLiked) await likePost(session.access, post.id);
      else await unlikePost(session.access, post.id);
    } catch {
      await load(true);
    }
  };

  const toggleBookmark = async (post: ForumPost) => {
    const nextBookmarked = !post.is_bookmarked;
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, is_bookmarked: nextBookmarked } : item));
    try {
      if (nextBookmarked) await bookmarkPost(session.access, post.id);
      else await unbookmarkPost(session.access, post.id);
    } catch {
      await load(true);
    }
  };

  const openComments = async (post: ForumPost) => {
    setSelectedPost(post.id);
    setSelectedComment(null);
    setReplies([]);
    setComments([]);
    setCommentsError(null);
    setCommentsLoading(true);
    try {
      setComments(await getComments(session.access, post.id));
    } catch (error) {
      setCommentsError(messageFrom(error));
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!selectedPost || !commentText.trim()) return;
    try {
      const comment = await addComment(session.access, selectedPost, commentText.trim());
      setComments((current) => [comment, ...current]);
      setCommentText("");
      setPosts((current) => current.map((post) => post.id === selectedPost ? { ...post, comments_count: post.comments_count + 1 } : post));
    } catch (error) {
      Alert.alert("Comment not posted", messageFrom(error));
    }
  };

  const openReplies = async (comment: ForumComment) => {
    setSelectedComment(comment.id);
    setReplies([]);
    setRepliesError(null);
    setRepliesLoading(true);
    try {
      setReplies(await getReplies(session.access, comment.id));
    } catch (error) {
      setRepliesError(messageFrom(error));
    } finally {
      setRepliesLoading(false);
    }
  };

  const submitReply = async () => {
    if (!selectedComment || !replyText.trim()) return;
    try {
      const reply = await addReply(session.access, selectedComment, replyText.trim());
      setReplies((current) => [...current, reply]);
      setReplyText("");
      setComments((current) => current.map((comment) => comment.id === selectedComment ? { ...comment, reply_count: (comment.reply_count ?? 0) + 1 } : comment));
    } catch (error) {
      Alert.alert("Reply not posted", messageFrom(error));
    }
  };

  const submitReport = async () => {
    if (!reportTarget || !reportReason.trim() || reporting) return;
    setReporting(true);
    try {
      await reportPost(session.access, reportTarget, reportReason.trim());
      setReportTarget(null);
      setReportReason("");
      Alert.alert("Report submitted", "Thanks. The SabiWay moderation team can now review this post.");
    } catch (error) {
      Alert.alert("Report not submitted", messageFrom(error));
    } finally {
      setReporting(false);
    }
  };

  const empty = useMemo(() => !loading && !loadError && posts.length === 0, [loading, loadError, posts.length]);

  return (
    <View style={styles.screen}>
      <View style={[styles.shell, { width: contentWidth }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>SABIWAY</Text>
            <Text accessibilityRole="header" style={styles.title}>SabiForum</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={onSignOut} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.composer}>
          <Text style={styles.composerLabel}>Share with the community</Text>
          <TextInput accessibilityLabel="Create a SabiForum post" multiline value={content} onChangeText={setContent} placeholder="Ask a question, share an insight, or start a discussion…" placeholderTextColor={colors.muted} style={styles.input} />
          {postImage ? <Image source={{ uri: postImage.uri }} style={styles.previewImage} accessibilityLabel="Selected post image" /> : null}
          <View style={styles.composerActions}>
            <Pressable accessibilityRole="button" onPress={() => void pickImage(setPostImage)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{postImage ? "Change image" : "Add image"}</Text></Pressable>
            {postImage ? <Pressable accessibilityRole="button" onPress={() => setPostImage(null)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Remove</Text></Pressable> : null}
            <Pressable accessibilityRole="button" disabled={(!content.trim() && !postImage) || posting} onPress={() => void publish()} style={[styles.primaryButton, ((!content.trim() && !postImage) || posting) && styles.disabled]}><Text style={styles.primaryButtonText}>{posting ? "Posting…" : "Post"}</Text></Pressable>
          </View>
        </View>

        {loading ? <ActivityIndicator accessibilityLabel="Loading SabiForum" color={colors.brand} size="large" style={styles.loader} /> : null}
        {loadError ? <ErrorCard title="Could not load SabiForum" message={loadError} retry={() => void load()} /> : null}
        {empty ? <Text style={styles.empty}>No posts yet. Start the first conversation.</Text> : null}

        <FlatList
          data={loadError ? [] : posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />}
          renderItem={({ item }) => {
            const isOwner = item.author.user_id === session.user.id;
            return (
              <View style={styles.postCard}>
                <View style={styles.authorRow}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{item.author.full_name.slice(0, 1).toUpperCase()}</Text></View>
                  <View style={styles.authorCopy}><Text style={styles.author}>{item.author.full_name}</Text><Text style={styles.handle}>{item.author.username} · {new Date(item.created_at).toLocaleDateString("en-GB")}</Text></View>
                  {isOwner ? <View style={styles.ownerActions}><Action label="Edit" onPress={() => startEdit(item)} /><Action label={deletingId === item.id ? "Deleting…" : "Delete"} onPress={() => confirmDelete(item)} disabled={deletingId === item.id} /></View> : null}
                </View>
                <Text style={styles.postText}>{item.content}</Text>
                {item.image ? <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" accessibilityLabel="Post image" /> : null}
                <View style={styles.actions}>
                  <Action label={`${item.is_liked ? "Unlike" : "Like"} ${item.likes_count}`} onPress={() => void toggleLike(item)} active={item.is_liked} />
                  <Action label={`Comments ${item.comments_count}`} onPress={() => void openComments(item)} />
                  <Action label={item.is_bookmarked ? "Saved" : "Save"} onPress={() => void toggleBookmark(item)} active={item.is_bookmarked} />
                  <Action label={`Repost ${item.reposts_count}`} onPress={async () => { try { await repostPost(session.access, item.id); await load(true); } catch (error) { Alert.alert("Could not repost", messageFrom(error)); } }} />
                  {!isOwner ? <Action label="Report" onPress={() => { setReportTarget(item.id); setReportReason(""); }} /> : null}
                </View>

                {selectedPost === item.id ? (
                  <View style={styles.commentsPanel}>
                    <View style={styles.commentComposer}>
                      <TextInput accessibilityLabel="Write a comment" value={commentText} onChangeText={setCommentText} placeholder="Write a comment…" placeholderTextColor={colors.muted} style={styles.commentInput} />
                      <Pressable accessibilityRole="button" disabled={!commentText.trim()} onPress={() => void submitComment()} style={[styles.commentButton, !commentText.trim() && styles.disabled]}><Text style={styles.commentButtonText}>Reply</Text></Pressable>
                    </View>
                    {commentsLoading ? <ActivityIndicator accessibilityLabel="Loading comments" color={colors.brand} /> : null}
                    {commentsError ? <InlineError message={commentsError} retry={() => void openComments(item)} /> : null}
                    {comments.map((comment) => (
                      <View key={comment.id} style={styles.comment}>
                        <Text style={styles.commentAuthor}>{comment.user.full_name}</Text><Text style={styles.commentText}>{comment.content}</Text>
                        {comment.image ? <Image source={{ uri: comment.image }} style={styles.commentImage} accessibilityLabel="Comment image" /> : null}
                        <Pressable accessibilityRole="button" accessibilityLabel={`View replies to ${comment.user.full_name}`} onPress={() => void openReplies(comment)} style={styles.replyLink}><Text style={styles.retryText}>{comment.reply_count ?? 0} replies · Reply</Text></Pressable>
                        {selectedComment === comment.id ? (
                          <View style={styles.repliesPanel}>
                            {repliesLoading ? <ActivityIndicator accessibilityLabel="Loading replies" color={colors.brand} /> : null}
                            {repliesError ? <InlineError message={repliesError} retry={() => void openReplies(comment)} /> : null}
                            {replies.map((reply) => <View key={reply.id} style={styles.reply}><Text style={styles.commentAuthor}>{reply.user.full_name}</Text><Text style={styles.commentText}>{reply.content}</Text>{reply.image ? <Image source={{ uri: reply.image }} style={styles.commentImage} accessibilityLabel="Reply image" /> : null}</View>)}
                            <View style={styles.commentComposer}><TextInput accessibilityLabel="Write a reply" value={replyText} onChangeText={setReplyText} placeholder="Write a reply…" placeholderTextColor={colors.muted} style={styles.commentInput} /><Pressable accessibilityRole="button" disabled={!replyText.trim()} onPress={() => void submitReply()} style={[styles.commentButton, !replyText.trim() && styles.disabled]}><Text style={styles.commentButtonText}>Send</Text></Pressable></View>
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      </View>

      {editingPost ? (
        <View style={styles.sheetWrap} accessibilityViewIsModal>
          <View style={[styles.sheet, { width: contentWidth }]}>
            <Text accessibilityRole="header" style={styles.sheetTitle}>Edit post</Text>
            <TextInput accessibilityLabel="Edit post content" multiline value={editContent} onChangeText={setEditContent} style={[styles.input, styles.reportInput]} />
            {editImage ? <Image source={{ uri: editImage.uri }} style={styles.previewImage} accessibilityLabel="New post image" /> : editingPost.image ? <Image source={{ uri: editingPost.image }} style={styles.previewImage} accessibilityLabel="Current post image" /> : null}
            <View style={styles.sheetActions}>
              <Pressable accessibilityRole="button" disabled={savingEdit} onPress={() => void pickImage(setEditImage)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Choose image</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={savingEdit} onPress={() => { setEditingPost(null); setEditImage(null); }} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Cancel</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={(!editContent.trim() && !editImage) || savingEdit} onPress={() => void saveEdit()} style={[styles.primaryButton, ((!editContent.trim() && !editImage) || savingEdit) && styles.disabled]}><Text style={styles.primaryButtonText}>{savingEdit ? "Saving…" : "Save"}</Text></Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {reportTarget ? (
        <View style={styles.sheetWrap} accessibilityViewIsModal>
          <View style={[styles.sheet, { width: contentWidth }]}>
            <Text accessibilityRole="header" style={styles.sheetTitle}>Report post</Text>
            <Text style={styles.sheetCopy}>Tell the moderation team what needs review. Do not include sensitive personal information.</Text>
            <TextInput accessibilityLabel="Reason for reporting this post" multiline value={reportReason} onChangeText={setReportReason} placeholder="Why should this post be reviewed?" placeholderTextColor={colors.muted} style={[styles.input, styles.reportInput]} />
            <View style={styles.sheetActions}>
              <Pressable accessibilityRole="button" disabled={reporting} onPress={() => { setReportTarget(null); setReportReason(""); }} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Cancel</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={!reportReason.trim() || reporting} onPress={() => void submitReport()} style={[styles.primaryButton, (!reportReason.trim() || reporting) && styles.disabled]}><Text style={styles.primaryButtonText}>{reporting ? "Submitting…" : "Submit report"}</Text></Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Action({ label, onPress, active = false, disabled = false }: { label: string; onPress: () => void; active?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, active && styles.actionActive, disabled && styles.disabled, pressed && styles.pressed]}><Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text></Pressable>;
}

function ErrorCard({ title, message, retry }: { title: string; message: string; retry: () => void }) {
  return <View accessibilityRole="alert" style={styles.errorCard}><Text style={styles.errorTitle}>{title}</Text><Text style={styles.errorText}>{message}</Text><Pressable accessibilityRole="button" onPress={retry} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Try again</Text></Pressable></View>;
}

function InlineError({ message, retry }: { message: string; retry: () => void }) {
  return <View style={styles.inlineError}><Text style={styles.errorText}>{message}</Text><Pressable accessibilityRole="button" onPress={retry}><Text style={styles.retryText}>Try again</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", backgroundColor: colors.background },
  shell: { flex: 1, maxWidth: 720, paddingTop: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  brand: { color: colors.brand, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  secondaryButton: { minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, alignItems: "center" },
  secondaryButtonText: { color: colors.text, fontWeight: "700" },
  composer: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, gap: 10, marginBottom: 12 },
  composerLabel: { color: colors.text, fontWeight: "800", fontSize: 15 },
  composerActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" },
  input: { minHeight: 86, textAlignVertical: "top", color: colors.text, fontSize: 16, lineHeight: 23, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
  primaryButton: { minHeight: 44, justifyContent: "center", alignItems: "center", backgroundColor: colors.brand, borderRadius: 12, paddingHorizontal: 18 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "900" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  loader: { marginTop: 40 },
  empty: { color: colors.muted, textAlign: "center", paddingVertical: 42 },
  list: { gap: 12, paddingBottom: 36 },
  postCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 15, gap: 12 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontWeight: "900" },
  authorCopy: { flex: 1 },
  author: { color: colors.text, fontWeight: "800", fontSize: 15 },
  handle: { color: colors.muted, marginTop: 2, fontSize: 12 },
  ownerActions: { flexDirection: "row", gap: 6 },
  postText: { color: colors.text, fontSize: 16, lineHeight: 24 },
  postImage: { width: "100%", height: 260, borderRadius: 14, backgroundColor: colors.background },
  previewImage: { width: "100%", height: 180, borderRadius: 12, backgroundColor: colors.background },
  commentImage: { width: "100%", height: 140, borderRadius: 10, marginTop: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  action: { minHeight: 40, justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11 },
  actionActive: { backgroundColor: "#E7F7F0", borderColor: colors.brand },
  actionText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  actionTextActive: { color: colors.brand },
  commentsPanel: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 8 },
  commentComposer: { flexDirection: "row", gap: 8 },
  commentInput: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, color: colors.text },
  commentButton: { minHeight: 44, justifyContent: "center", backgroundColor: colors.brandStrong, borderRadius: 12, paddingHorizontal: 14 },
  commentButtonText: { color: "#FFFFFF", fontWeight: "800" },
  comment: { backgroundColor: colors.background, borderRadius: 12, padding: 10 },
  commentAuthor: { color: colors.text, fontWeight: "800", fontSize: 13 },
  commentText: { color: colors.text, marginTop: 4, lineHeight: 20 },
  replyLink: { minHeight: 36, justifyContent: "center", alignSelf: "flex-start" },
  repliesPanel: { borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: 10, gap: 8, marginTop: 4 },
  reply: { backgroundColor: colors.surface, borderRadius: 10, padding: 9 },
  errorCard: { marginVertical: 16, borderWidth: 1, borderColor: colors.danger, borderRadius: 16, backgroundColor: colors.surface, padding: 16, gap: 10 },
  errorTitle: { color: colors.text, fontWeight: "900", fontSize: 16 },
  errorText: { color: colors.muted, lineHeight: 20 },
  inlineError: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, gap: 6 },
  retryText: { color: colors.brand, fontWeight: "800", fontSize: 13 },
  sheetWrap: { ...StyleSheet.absoluteFillObject, zIndex: 20, justifyContent: "flex-end", alignItems: "center", backgroundColor: "rgba(0,0,0,0.38)" },
  sheet: { maxWidth: 720, backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, gap: 12 },
  sheetTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  sheetCopy: { color: colors.muted, lineHeight: 20 },
  reportInput: { minHeight: 110 },
  sheetActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 },
});
