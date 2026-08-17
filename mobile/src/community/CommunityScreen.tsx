import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  getComments,
  getPosts,
  getReplies,
  likePost,
  reportPost,
  repostPost,
  unbookmarkPost,
  unlikePost,
} from "./api";
import type { ForumComment, ForumPost, ForumReply } from "./types";

type Props = {
  session: AuthSession;
  onSignOut: () => void;
};

export function CommunityScreen({ session, onSignOut }: Props) {
  const { width } = useWindowDimensions();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const contentWidth = Math.min(width - 24, 720);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setLoadError(null);
    try {
      setPosts(await getPosts(session.access));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.access]);

  useEffect(() => { void load(); }, [load]);

  const publish = async () => {
    const trimmed = content.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      const post = await createPost(session.access, trimmed);
      setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
      setContent("");
    } catch (error) {
      Alert.alert("Post not published", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setPosting(false);
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
      setCommentsError(error instanceof Error ? error.message : "Please try again.");
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
      Alert.alert("Comment not posted", error instanceof Error ? error.message : "Please try again.");
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
      setRepliesError(error instanceof Error ? error.message : "Please try again.");
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
      Alert.alert("Reply not posted", error instanceof Error ? error.message : "Please try again.");
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
      Alert.alert("Report not submitted", error instanceof Error ? error.message : "Please try again.");
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
          <TextInput
            accessibilityLabel="Create a SabiForum post"
            multiline
            value={content}
            onChangeText={setContent}
            placeholder="Ask a question, share an insight, or start a discussion…"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <Pressable accessibilityRole="button" disabled={!content.trim() || posting} onPress={publish} style={({ pressed }) => [styles.primaryButton, (!content.trim() || posting) && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>{posting ? "Posting…" : "Post"}</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator accessibilityLabel="Loading SabiForum" color={colors.brand} size="large" style={styles.loader} /> : null}
        {loadError ? (
          <View accessibilityRole="alert" style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load SabiForum</Text>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Try again</Text></Pressable>
          </View>
        ) : null}
        {empty ? <Text style={styles.empty}>No posts yet. Start the first conversation.</Text> : null}

        <FlatList
          data={loadError ? [] : posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <View style={styles.authorRow}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{item.author.full_name.slice(0, 1).toUpperCase()}</Text></View>
                <View style={styles.authorCopy}>
                  <Text style={styles.author}>{item.author.full_name}</Text>
                  <Text style={styles.handle}>{item.author.username} · {new Date(item.created_at).toLocaleDateString("en-GB")}</Text>
                </View>
              </View>
              <Text style={styles.postText}>{item.content}</Text>
              <View style={styles.actions}>
                <Action label={`${item.is_liked ? "Unlike" : "Like"} ${item.likes_count}`} onPress={() => void toggleLike(item)} active={item.is_liked} />
                <Action label={`Comments ${item.comments_count}`} onPress={() => void openComments(item)} />
                <Action label={item.is_bookmarked ? "Saved" : "Save"} onPress={() => void toggleBookmark(item)} active={item.is_bookmarked} />
                <Action label={`Repost ${item.reposts_count}`} onPress={async () => { try { await repostPost(session.access, item.id); await load(true); } catch (error) { Alert.alert("Could not repost", error instanceof Error ? error.message : "Please try again."); } }} />
                <Action label="Report" onPress={() => { setReportTarget(item.id); setReportReason(""); }} />
              </View>
              {selectedPost === item.id ? (
                <View style={styles.commentsPanel}>
                  <View style={styles.commentComposer}>
                    <TextInput accessibilityLabel="Write a comment" value={commentText} onChangeText={setCommentText} placeholder="Write a comment…" placeholderTextColor={colors.muted} style={styles.commentInput} />
                    <Pressable accessibilityRole="button" disabled={!commentText.trim()} onPress={() => void submitComment()} style={[styles.commentButton, !commentText.trim() && styles.disabled]}><Text style={styles.commentButtonText}>Reply</Text></Pressable>
                  </View>
                  {commentsLoading ? <ActivityIndicator accessibilityLabel="Loading comments" color={colors.brand} /> : null}
                  {commentsError ? (
                    <View style={styles.inlineError}><Text style={styles.errorText}>{commentsError}</Text><Pressable accessibilityRole="button" onPress={() => void openComments(item)}><Text style={styles.retryText}>Try again</Text></Pressable></View>
                  ) : null}
                  {comments.map((comment) => (
                    <View key={comment.id} style={styles.comment}>
                      <Text style={styles.commentAuthor}>{comment.user.full_name}</Text>
                      <Text style={styles.commentText}>{comment.content}</Text>
                      <Pressable accessibilityRole="button" accessibilityLabel={`View replies to ${comment.user.full_name}`} onPress={() => void openReplies(comment)} style={styles.replyLink}>
                        <Text style={styles.retryText}>{comment.reply_count ?? 0} replies · Reply</Text>
                      </Pressable>
                      {selectedComment === comment.id ? (
                        <View style={styles.repliesPanel}>
                          {repliesLoading ? <ActivityIndicator accessibilityLabel="Loading replies" color={colors.brand} /> : null}
                          {repliesError ? <View style={styles.inlineError}><Text style={styles.errorText}>{repliesError}</Text><Pressable accessibilityRole="button" onPress={() => void openReplies(comment)}><Text style={styles.retryText}>Try again</Text></Pressable></View> : null}
                          {replies.map((reply) => (
                            <View key={reply.id} style={styles.reply}>
                              <Text style={styles.commentAuthor}>{reply.user.full_name}</Text>
                              <Text style={styles.commentText}>{reply.content}</Text>
                            </View>
                          ))}
                          <View style={styles.commentComposer}>
                            <TextInput accessibilityLabel="Write a reply" value={replyText} onChangeText={setReplyText} placeholder="Write a reply…" placeholderTextColor={colors.muted} style={styles.commentInput} />
                            <Pressable accessibilityRole="button" disabled={!replyText.trim()} onPress={() => void submitReply()} style={[styles.commentButton, !replyText.trim() && styles.disabled]}><Text style={styles.commentButtonText}>Send</Text></Pressable>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        />
      </View>

      {reportTarget ? (
        <View style={styles.sheetWrap} accessibilityViewIsModal>
          <View style={[styles.sheet, { width: contentWidth }]}>
            <Text accessibilityRole="header" style={styles.sheetTitle}>Report post</Text>
            <Text style={styles.sheetCopy}>Tell the moderation team what needs review. Do not include sensitive personal information.</Text>
            <TextInput
              accessibilityLabel="Reason for reporting this post"
              multiline
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="Why should this post be reviewed?"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.reportInput]}
            />
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

function Action({ label, onPress, active = false }: { label: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.action, active && styles.actionActive, pressed && styles.pressed]}>
      <Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text>
    </Pressable>
  );
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
  input: { minHeight: 86, textAlignVertical: "top", color: colors.text, fontSize: 16, lineHeight: 23, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
  primaryButton: { alignSelf: "flex-end", minHeight: 44, justifyContent: "center", backgroundColor: colors.brand, borderRadius: 12, paddingHorizontal: 22, alignItems: "center" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "900" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  loader: { marginTop: 40 },
  empty: { color: colors.muted, textAlign: "center", paddingVertical: 42 },
  errorCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, gap: 10, marginTop: 16 },
  errorTitle: { color: colors.text, fontWeight: "900", fontSize: 16 },
  errorText: { color: colors.muted, lineHeight: 20 },
  inlineError: { backgroundColor: colors.background, borderRadius: 10, padding: 10, gap: 4 },
  retryText: { color: colors.brand, fontWeight: "800", fontSize: 12 },
  list: { gap: 12, paddingBottom: 36 },
  postCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 15, gap: 12 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontWeight: "900" },
  authorCopy: { flex: 1 },
  author: { color: colors.text, fontWeight: "800", fontSize: 15 },
  handle: { color: colors.muted, marginTop: 2, fontSize: 12 },
  postText: { color: colors.text, fontSize: 16, lineHeight: 24 },
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
  comment: { backgroundColor: colors.background, borderRadius: 12, padding: 10, gap: 4 },
  commentAuthor: { color: colors.text, fontWeight: "800", fontSize: 13 },
  commentText: { color: colors.text, marginTop: 2, lineHeight: 20 },
  replyLink: { alignSelf: "flex-start", minHeight: 32, justifyContent: "center" },
  repliesPanel: { marginTop: 6, marginLeft: 10, borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: 10, gap: 8 },
  reply: { backgroundColor: colors.surface, borderRadius: 10, padding: 9 },
  sheetWrap: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(23,49,38,0.42)", alignItems: "center", justifyContent: "flex-end", paddingBottom: 12 },
  sheet: { backgroundColor: colors.surface, borderRadius: 24, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.border },
  sheetTitle: { color: colors.text, fontWeight: "900", fontSize: 20 },
  sheetCopy: { color: colors.muted, lineHeight: 20 },
  reportInput: { minHeight: 120 },
  sheetActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
});
