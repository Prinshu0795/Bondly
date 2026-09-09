import { useState, useRef } from 'react';
import { postService } from '../services/endpoints';

export default function CreatePost({ onPostCreated }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const removeImage = () => {
    setImage(null);
    setPreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (text.trim()) formData.append('text', text.trim());
      if (image) formData.append('image', image);

      const res = await postService.createPost(formData);
      onPostCreated(res.data.post);

      // Reset form
      setText('');
      removeImage();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !text.trim() && !image;

  return (
    <div className="create-post card">
      <form onSubmit={handleSubmit}>
        <textarea
          className="create-post-input"
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={2000}
        />

        {preview && (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
            <button type="button" className="remove-image" onClick={removeImage}>
              ✕
            </button>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        <div className="create-post-actions">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => fileRef.current?.click()}
          >
            📷 Add Image
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageChange}
            hidden
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isDisabled || loading}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
