document.addEventListener('DOMContentLoaded', async () => {
  if (!window.supabaseClient) {
    console.error('Supabase client not initialized');
    return;
  }

  const emailInput = document.getElementById('profile-email');
  const nameInput = document.getElementById('profile-name');
  const roleInput = document.getElementById('profile-role');
  const avatarPreview = document.getElementById('profile-avatar-preview');
  const form = document.getElementById('profile-form');
  const messageEl = document.getElementById('profile-message');
  const saveBtn = document.getElementById('save-profile-btn');

  let currentUserId = null;

  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    currentUserId = session.user.id;
    const email = session.user.email;
    emailInput.value = email || '';
    
    if (email) {
      avatarPreview.textContent = email.charAt(0).toUpperCase();
    }

    // Load profile from users table
    const { data: profile, error } = await window.supabaseClient
      .from('users')
      .select('full_name, role')
      .eq('id', currentUserId)
      .single();

    if (error) throw error;

    if (profile) {
      nameInput.value = profile.full_name || '';
      roleInput.value = profile.role || '';
    }
  } catch (err) {
    console.error('Error loading profile:', err);
    showMessage('Failed to load profile data.', 'error');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) return;

    const newName = nameInput.value.trim();
    if (!newName) return;

    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Saving...';
    saveBtn.disabled = true;

    try {
      const { error } = await window.supabaseClient
        .from('users')
        .update({ full_name: newName })
        .eq('id', currentUserId);

      if (error) throw error;

      showMessage('Profile updated successfully!', 'success');
      
      // Update the header UI name
      const nameEl = document.getElementById('auth-user-name');
      if (nameEl) {
        nameEl.textContent = newName;
      }
      
    } catch (err) {
      console.error('Error updating profile:', err);
      showMessage('Failed to update profile.', 'error');
    } finally {
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
      if (window.lucide) lucide.createIcons();
    }
  });

  function showMessage(msg, type) {
    messageEl.textContent = msg;
    messageEl.style.display = 'block';
    if (type === 'success') {
      messageEl.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
      messageEl.style.color = '#10b981';
      messageEl.style.border = '1px solid #10b981';
    } else {
      messageEl.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
      messageEl.style.color = '#ef4444';
      messageEl.style.border = '1px solid #ef4444';
    }
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 4000);
  }
});
