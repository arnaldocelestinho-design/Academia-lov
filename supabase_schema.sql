-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  user_type TEXT DEFAULT 'normal',
  avatar_url TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create premium_data table
CREATE TABLE premium_data (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bi_number TEXT,
  birth_date DATE,
  age INTEGER,
  gender TEXT,
  address TEXT,
  height DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('image', 'video')),
  content_url TEXT NOT NULL,
  description TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create stories table
CREATE TABLE stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('image', 'video', 'text')),
  content_url TEXT,
  text_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create likes table
CREATE TABLE likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'audio', 'document')),
  content_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone." ON posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts." ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts." ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts." ON posts FOR DELETE USING (auth.uid() = user_id);

-- Stories policies
CREATE POLICY "Stories are viewable by everyone." ON stories FOR SELECT USING (true);
CREATE POLICY "Users can insert their own stories." ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stories." ON stories FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone." ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments." ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments." ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone." ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes." ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes." ON likes FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view their own messages." ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert their own messages." ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
