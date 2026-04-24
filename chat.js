// Chat Functions for Supabase

let currentChatId = null;
let currentChatType = null;
let messagesListener = null;

// Initialize Chat
async function initializeChat() {
    loadDirectMessages();
    loadChannels();
    setupEventListeners();
    setupUserStatus();
}

// Setup User Status Updates
function setupUserStatus() {
    if (!currentUser) return;
    
    // Update user status to online
    supabase
        .from('users')
        .update({ status: 'online', last_seen: new Date() })
        .eq('id', currentUser.id)
        .then();
    
    // Update every 30 seconds
    setInterval(() => {
        if (currentUser) {
            supabase
                .from('users')
                .update({ last_seen: new Date() })
                .eq('id', currentUser.id)
                .then();
        }
    }, 30000);
    
    // Set offline when leaving
    window.addEventListener('beforeunload', async () => {
        if (currentUser) {
            await supabase
                .from('users')
                .update({ status: 'offline' })
                .eq('id', currentUser.id);
        }
    });
}

// Load Direct Messages
async function loadDirectMessages() {
    try {
        const { data, error } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
            .order('last_message_time', { ascending: false });
        
        if (error) throw error;
        
        const dmList = document.getElementById('dmList');
        dmList.innerHTML = '';
        
        for (const dm of data) {
            const otherUserId = dm.user1_id === currentUser.id ? dm.user2_id : dm.user1_id;
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('username, status')
                .eq('id', otherUserId)
                .single();
            
            if (userError) continue;
            
            const dmElement = document.createElement('div');
            dmElement.className = 'chat-item';
            dmElement.innerHTML = `
                <div class="chat-item-content">
                    <div class="chat-item-name">${userData.username}</div>
                    <div class="chat-item-status ${userData.status}"></div>
                </div>
            `;
            
            dmElement.addEventListener('click', () => selectChat(dm.id, 'dm'));
            dmList.appendChild(dmElement);
        }
    } catch (error) {
        console.error('Error loading DMs:', error);
    }
}

// Load Channels
async function loadChannels() {
    try {
        const { data, error } = await supabase
            .from('channels')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        const channelList = document.getElementById('channelList');
        channelList.innerHTML = '';
        
        for (const channel of data) {
            const channelElement = document.createElement('div');
            channelElement.className = 'chat-item';
            channelElement.innerHTML = `
                <div class="chat-item-content">
                    <div class="chat-item-name"># ${channel.name}</div>
                </div>
            `;
            
            channelElement.addEventListener('click', () => selectChat(channel.id, 'channel'));
            channelList.appendChild(channelElement);
        }
    } catch (error) {
        console.error('Error loading channels:', error);
    }
}

// Select Chat
async function selectChat(chatId, chatType) {
    currentChatId = chatId;
    currentChatType = chatType;
    
    // Remove previous listener
    if (messagesListener) {
        messagesListener.unsubscribe();
    }
    
    // Update header
    if (chatType === 'dm') {
        const { data: dm, error } = await supabase
            .from('direct_messages')
            .select('*')
            .eq('id', chatId)
            .single();
        
        if (error) return;
        
        const otherUserId = dm.user1_id === currentUser.id ? dm.user2_id : dm.user1_id;
        const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', otherUserId)
            .single();
        
        document.getElementById('chatTitle').textContent = userData.username;
    } else {
        const { data: channel } = await supabase
            .from('channels')
            .select('name')
            .eq('id', chatId)
            .single();
        
        document.getElementById('chatTitle').textContent = `# ${channel.name}`;
    }
    
    // Load messages
    await loadMessages();
    
    // Setup real-time listener
    messagesListener = supabase
        .channel(`messages:chat_id=eq.${chatId}`)
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
            (payload) => {
                addMessageToUI(payload.new);
            }
        )
        .subscribe();
    
    // Enable message input
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
}

// Load Messages
async function loadMessages() {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', currentChatId)
            .order('created_at', { ascending: true })
            .limit(50);
        
        if (error) throw error;
        
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        
        for (const message of data) {
            addMessageToUI(message);
        }
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Add Message to UI
function addMessageToUI(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.user_id === currentUser.id ? 'own' : 'other'}`;
    
    const time = new Date(message.created_at).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-author">${message.user_name}</div>
            <div class="message-text">${escapeHtml(message.text)}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send Message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !currentChatId) return;
    
    try {
        const { error } = await supabase
            .from('messages')
            .insert({
                chat_id: currentChatId,
                chat_type: currentChatType,
                user_id: currentUser.id,
                user_name: currentUser.user_metadata?.username || currentUser.email,
                text: text
            });
        
        if (error) throw error;
        
        input.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // New DM
    document.getElementById('newDmBtn').addEventListener('click', () => {
        document.getElementById('newDmModal').style.display = 'block';
        document.getElementById('dmSearch').focus();
    });
    
    document.getElementById('dmSearch').addEventListener('input', searchUsers);
    
    // New Channel
    document.getElementById('newChannelBtn').addEventListener('click', () => {
        document.getElementById('newChannelModal').style.display = 'block';
    });
    
    document.getElementById('channelForm').addEventListener('submit', createChannel);
    
    // Profile
    document.getElementById('profileBtn').addEventListener('click', showProfile);
}

// Search Users for DM
async function searchUsers(e) {
    const query = e.target.value.toLowerCase();
    const results = document.getElementById('dmSearchResults');
    
    if (!query) {
        results.innerHTML = '';
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, email')
            .neq('id', currentUser.id)
            .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(5);
        
        if (error) throw error;
        
        results.innerHTML = '';
        
        for (const user of data) {
            const userElement = document.createElement('div');
            userElement.className = 'search-result-item';
            userElement.innerHTML = `
                <div>${user.username}</div>
                <small>${user.email}</small>
            `;
            
            userElement.addEventListener('click', () => startDirectMessage(user.id));
            results.appendChild(userElement);
        }
    } catch (error) {
        console.error('Error searching users:', error);
    }
}

// Start Direct Message
async function startDirectMessage(otherUserId) {
    try {
        // Check if DM already exists
        const { data: existingDM } = await supabase
            .from('direct_messages')
            .select('id')
            .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUser.id})`)
            .single();
        
        if (existingDM) {
            closeModal('newDmModal');
            selectChat(existingDM.id, 'dm');
            return;
        }
        
        // Create new DM
        const { data, error } = await supabase
            .from('direct_messages')
            .insert({
                user1_id: currentUser.id,
                user2_id: otherUserId
            })
            .select()
            .single();
        
        if (error) throw error;
        
        closeModal('newDmModal');
        loadDirectMessages();
        selectChat(data.id, 'dm');
    } catch (error) {
        console.error('Error starting DM:', error);
    }
}

// Create Channel
async function createChannel(e) {
    e.preventDefault();
    
    const name = document.getElementById('channelName').value.trim();
    const description = document.getElementById('channelDesc').value.trim();
    
    if (!name) return;
    
    try {
        const { data, error } = await supabase
            .from('channels')
            .insert({
                name: name,
                description: description || null,
                created_by: currentUser.id
            })
            .select()
            .single();
        
        if (error) throw error;
        
        document.getElementById('channelForm').reset();
        closeModal('newChannelModal');
        loadChannels();
        selectChat(data.id, 'channel');
    } catch (error) {
        console.error('Error creating channel:', error);
        alert('Failed to create channel');
    }
}

// Show Profile
async function showProfile() {
    try {
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        const content = document.getElementById('profileContent');
        content.innerHTML = `
            <div class="profile-info">
                <p><strong>Username:</strong> ${userData.username}</p>
                <p><strong>Email:</strong> ${userData.email}</p>
                <p><strong>Status:</strong> ${userData.status}</p>
                <p><strong>Member Since:</strong> ${new Date(userData.created_at).toLocaleDateString()}</p>
            </div>
        `;
        
        document.getElementById('profileModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Close Modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
