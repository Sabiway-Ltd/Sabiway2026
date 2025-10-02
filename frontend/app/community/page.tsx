// app/community/page.tsx

'use client'

import CommunityNavbar from "../_components/CommunityNavbar";
import PostCard from "../_components/feed/PostCard";

export default function Community() {
  // Mock data (replace with API later)
  const posts = [
    {
      id: 1,
      author: {
        name: "John Doe",
        username: "johndoe",
        avatar: "https://i.pravatar.cc/150?img=1",
      },
      content: "Lorem ipsum dolor, lorem ipusm dolor lorem ipusm dolor lorem ipusm dolor lorem ipusm dolor lorem ipusm dolorLorem ipusm dolor lorem ipusm dolor lorem ipusm dolor lorem ipusm dolor lorem ipusm dolor Show more",
      image: "https://res.cloudinary.com/devqbjptr/image/upload/v1759402383/image_b8hxtw.png",
      likes: 12,
      comments: 4,
      impressions: 150,
      commentsData: [
        {
          id: 101,
          author: {
            name: "Jane Smith",
            username: "janesmith",
            avatar: "https://i.pravatar.cc/150?img=2",
          },
          content: "Nice work John! 👏",
          likes: 2,
          comments: 1,
          impressions: 10,
          replies: [
            {
              id: 102,
              author: {
                name: "Alex Lee",
                username: "alexlee",
                avatar: "https://i.pravatar.cc/150?img=3",
              },
              content: "Agreed! Super clean UI 🚀",
              likes: 1,
              comments: 0,

              impressions: 5,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      author: {
        name: "Jane Smith",
        username: "janesmith",
        avatar: "https://i.pravatar.cc/150?img=4",
      },
      content: "Loving the new design! What do you guys think?",
      image: "https://res.cloudinary.com/devqbjptr/image/upload/v1759402383/image_b8hxtw.png",
      likes: 30,
      comments: 10,
      impressions: 300,
      commentsData: [
        {
          id: 201,
          author: {
            name: "John Doe",
            username: "johndoe",
            avatar: "https://i.pravatar.cc/150?img=5",
          },
          content: "It looks fantastic 🔥🔥🔥",
          likes: 4,
          comments: 0,
          impressions: 20,
        },
      ],
    },
    {
      id: 3,
      author: {
        name: "Alex Lee",
        username: "alexlee",
        avatar: "https://i.pravatar.cc/150?img=6",
      },
      content: "Working on adding comments and replies to the feed 👨‍💻🔥",
      image: "https://res.cloudinary.com/devqbjptr/image/upload/v1759402383/image_b8hxtw.png",
      likes: 7,
      comments: 1,
      impressions: 80,
      commentsData: [
        {
          id: 301,
          author: {
            name: "Jane Smith",
            username: "janesmith",
            avatar: "https://i.pravatar.cc/150?img=7",
          },
          content: "Threaded replies would be awesome! 🙌",
          likes: 3,
          comments: 1,
          impressions: 15,
          replies: [
            {
              id: 302,
              author: {
                name: "John Doe",
                username: "johndoe",
                avatar: "https://i.pravatar.cc/150?img=8",
              },
              content: "That’s what I’m working on 😉",
              likes: 2,
              comments: 0,

              impressions: 10,
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <CommunityNavbar />

        <section>
      {/* Feed */}
      <main className=" mt-4 bg-white border-x border-gray-200">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            author={post.author}
            content={post.content}
            image={post.image}
            likes={post.likes}
            comments={post.comments}
            impressions={post.impressions}
            commentsData={post.commentsData}
          />
        ))}
      </main>

      <div>
        <p>Hello Here</p>
      </div>
      </section>
    </div>
  );
}
