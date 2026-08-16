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
  bookmarkPost,
  createPost,
  getComments,
  getPosts,
  likePost,
  reportPost,
  repostPost,
  unbookmarkPost,
  unlikePost,
} from "./api";
import type { ForumComment, ForumPost } from "./types";

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
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const contentWidth = Math.min(width - 24, 720);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      setPosts(await getPosts(session.access));
    } catch (error) {
      Alert.alert("Could not load SabiForum", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.access]);

  useEffect(() => { load(); }, [load]);

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
    setComments([]);
    try {
      setComments(await getComments(session.access, post.id));
    } catch (error) {
      Alert.alert("Could not load comments", error instanceof Error ? error.message : "Please try again.");
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

  const empty = useMemo(() => !loading && posts.length === 0, [loading, posts.length]);

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
        {empty ? <Text style={styles.empty}>No posts yet. Start the first conversation.</Text> : null}

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
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
                <Action label={`${item.is_liked ? "Unlike" : "Like"} ${item.likes_count}`} onPress={() => toggleLike(item)} active={item.is_liked} />
                <Action label={`Comments ${item.comments_count}`} onPress={() => openComments(item)} />
                <Action label={item.is_bookmarked ? "Saved" : "Save"} onPress={() => toggleBookmark(item)} active={item.is_bookmarked} />
                <Action label={`Repost ${item.reposts_count}`} onPress={async () => { try { await repostPost(session.access, item.id); await load(true); } catch (error) { Alert.alert("Could not repost", error instanceof Error ? error.message : "Please try again."); } }} />
                <Action label="Report" onPress={() => Alert.prompt ? Alert.prompt("Report post", "Tell us why this post should be reviewed.", async (reason) => { if (reason?.trim()) await reportPost(session.access, item.id, reason.trim()); }) : Alert.alert("Report post", "Use SabiWay web to submit a detailed report on this device.")} />
              </View>
              {selectedPost === item.id ? (
                <View style={styles.commentsPanel}>
                  <View style={styles.commentComposer}>
                    <TextInput value={commentText} onChangeText={setCommentText} placeholder="Write a comment…" placeholderTextColor={colors.muted} style={styles.commentInput} />
                    <Pressable accessibilityRole="button" onPress={submitComment} style={styles.commentButton}><Text style={styles.commentButtonText}>Reply</Text></Pressable>
                  </View>
                  {comments.map((comment) => (
                    <View key={comment.id} style={styles.comment}><Text style={styles.commentAuthor}>{comment.user.full_name}</Text><Text style={styles.commentText}>{comment.content}</Text></View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        />
      </View>
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
  secondaryButton: { minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14 },
  secondaryButtonText: { color: colors.text, fontWeight: "700" },
  composer: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, gap: 10, marginBottom: 12 },
  composerLabel: { color: colors.text, fontWeight: "800", fontSize: 15 },
  input: { minHeight: 86, textAlignVertical: "top", color: colors.text, fontSize: 16, lineHeight: 23, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
  primaryButton: { alignSelf: "flex-end", minHeight: 44, justifyContent: "center", backgroundColor: colors.brand, borderRadius: 12, paddingHorizontal: 22 },
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
  comment: { backgroundColor: colors.background, borderRadius: 12, padding: 10 },
  commentAuthor: { color: colors.text, fontWeight: "800", fontSize: 13 },
  commentText: { color: colors.text, marginTop: 4, lineHeight: 20 },
});
