const MINISTRY_CHATS = ['Whole Church', 'Music Ministry', 'Sentry', 'Nursery', 'Media'];
        const storage = firebase.storage();
        var allAdminUsers = [];

        function filterAdminUsers() {
            const container = document.getElementById('users-list');
            const countEl = document.getElementById('adminSearchCount');
            const q = ((document.getElementById('adminSearch') || {}).value || '').trim().toLowerCase();
            if (!container) return;
            container.innerHTML = '';
            var shown = 0;
            allAdminUsers.forEach(function(user) {
                var name = (user.name || '').toLowerCase();
                var email = (user.email || '').toLowerCase();
                var phone = (user.phone || '').toLowerCase();
                if (!q || name.indexOf(q) !== -1 || email.indexOf(q) !== -1 || phone.indexOf(q) !== -1) {
                    container.appendChild(createUserCard(user));
                    shown++;
                }
            });
            if (countEl) {
                if (!allAdminUsers.length) countEl.textContent = '';
                else if (!q) countEl.textContent = allAdminUsers.length + ' member' + (allAdminUsers.length === 1 ? '' : 's');
                else countEl.textContent = shown + ' of ' + allAdminUsers.length + ' match' + (shown === 1 ? '' : 'es');
            }
            if (!shown) {
                container.innerHTML = q
                    ? '<p class="hint">No members match "' + q.replace(/</g,'&lt;') + '".</p>'
                    : '<p class="hint">No users found.</p>';
            }
        }

        async function loadUsers() {
            const container = document.getElementById('users-list');
            container.innerHTML = 'Loading users...';
            try {
                const snapshot = await db.collection('users').get();
                var groupsByUid = {};
                try {
                    const gsnap = await db.collection('musicGroups').get();
                    gsnap.forEach(function(doc) {
                        var d = doc.data() || {};
                        var name = (d.name || '').trim();
                        if (!name) return;
                        var uids = d.memberUids || [];
                        if ((!uids || !uids.length) && Array.isArray(d.members)) {
                            uids = d.members.map(function(m){ return m.uid; }).filter(Boolean);
                        }
                        uids.forEach(function(uid) {
                            if (!groupsByUid[uid]) groupsByUid[uid] = [];
                            if (groupsByUid[uid].indexOf(name) === -1) groupsByUid[uid].push(name);
                        });
                    });
                } catch (ge) { console.warn('musicGroups load for admin', ge); }

                allAdminUsers = [];
                if (snapshot.empty) {
                    container.innerHTML = 'No users found in the database.';
                    var countEl = document.getElementById('adminSearchCount');
                    if (countEl) countEl.textContent = '';
                    return;
                }
                snapshot.forEach(function(doc) {
                    const user = { uid: doc.id, ...doc.data() };
                    var fromProfile = Array.isArray(user.musicGroupNames) ? user.musicGroupNames.filter(Boolean) : [];
                    var fromGroups = groupsByUid[user.uid] || [];
                    var merged = fromProfile.slice();
                    fromGroups.forEach(function(n) {
                        if (merged.indexOf(n) === -1) merged.push(n);
                    });
                    user.musicGroupNames = merged;
                    allAdminUsers.push(user);
                });
                allAdminUsers.sort(function(a, b) {
                    return (a.name || a.email || '').localeCompare(b.name || b.email || '');
                });
                filterAdminUsers();
            } catch (err) {
                console.error('loadUsers error', err);
                container.innerHTML = 'Error loading users: ' + err.message;
            }
        }

        function createUserCard(user) {
            const div = document.createElement('div');
            div.className = 'user-card ' + (user.approved ? 'approved' : 'pending');
            div.dataset.uid = user.uid;

            const userMinistries = user.ministries || ['Whole Church'];
            const leaderOf = user.leaderOf || [];

            let ministryHTML = '<div class="ministry-checkboxes">';
            MINISTRY_CHATS.forEach(chat => {
                const checked = userMinistries.includes(chat) ? 'checked' : '';
                const disabled = chat === 'Whole Church' ? 'disabled' : '';
                ministryHTML += `
                    <label>
                        <input type="checkbox" data-field="ministries" data-uid="${user.uid}" value="${chat}" ${checked} ${disabled}>
                        ${chat}
                    </label>`;
            });
            ministryHTML += '</div>';

            let leaderHTML = '<div class="ministry-checkboxes">';
            MINISTRY_CHATS.forEach(chat => {
                const checked = leaderOf.includes(chat) ? 'checked' : '';
                leaderHTML += `
                    <label>
                        <input type="checkbox" data-field="leaderOf" data-uid="${user.uid}" value="${chat}" ${checked}>
                        ${chat}
                    </label>`;
            });
            leaderHTML += '</div>';

            const joinedVal = user.churchJoinedYear || (user.churchJoinedDate ? String(user.churchJoinedDate).slice(0,4) : '');
            const birthdayVal = user.birthday || '';
            const phoneVal = (user.phone || '').replace(/"/g, '&quot;');
            const addressVal = (user.address || '').replace(/"/g, '&quot;');
            const nameVal = (user.name || '').replace(/"/g, '&quot;');

            let profileHTML = '<div class="profile-fields">';
            profileHTML += '<label class="section-label" style="margin-top:0">Member info (admin can edit)</label>';
            profileHTML += '<label class="section-label" for="name-' + user.uid + '" style="margin-top:6px;font-weight:500">Name</label>';
            profileHTML += '<input class="role-select" type="text" id="name-' + user.uid + '" value="' + nameVal + '" placeholder="Full name">';
            profileHTML += '<label class="section-label" for="birthday-' + user.uid + '" style="font-weight:500">Birthday</label>';
            profileHTML += '<input class="role-select" type="date" id="birthday-' + user.uid + '" value="' + birthdayVal + '">';
            profileHTML += '<label class="section-label" for="joined-' + user.uid + '" style="font-weight:500">Year Joined Church</label>';
            profileHTML += '<input class="role-select" type="number" id="joined-' + user.uid + '" min="1900" max="2100" step="1" placeholder="e.g. 2015" value="' + joinedVal + '">';
            profileHTML += '<label class="section-label" for="phone-' + user.uid + '" style="font-weight:500">Phone</label>';
            profileHTML += '<input class="role-select" type="tel" id="phone-' + user.uid + '" value="' + phoneVal + '" placeholder="Phone">';
            profileHTML += '<label class="section-label" for="address-' + user.uid + '" style="font-weight:500">Address</label>';
            profileHTML += '<input class="role-select" type="text" id="address-' + user.uid + '" value="' + addressVal + '" placeholder="Address">';

            var songs = Array.isArray(user.songs) ? user.songs.filter(Boolean) : [];
            var groupNames = Array.isArray(user.musicGroupNames) ? user.musicGroupNames.filter(Boolean) : [];
            var photoURL = user.photoURL || '';

            profileHTML += '<label class="section-label" style="margin-top:10px">Profile photo</label>';
            profileHTML += '<div class="admin-avatar-row">';
            if (photoURL) {
                profileHTML += '<img class="admin-avatar" id="avatar-img-' + user.uid + '" src="' + photoURL.replace(/"/g, '&quot;') + '" alt="Photo">';
            } else {
                profileHTML += '<div class="admin-avatar-placeholder" id="avatar-ph-' + user.uid + '">No<br>photo</div>';
                profileHTML += '<img class="admin-avatar" id="avatar-img-' + user.uid + '" src="" alt="Photo" style="display:none">';
            }
            profileHTML += '<div style="flex:1">';
            profileHTML += '<input type="file" accept="image/*" id="photo-file-' + user.uid + '" onchange="adminUploadPhoto(\'' + user.uid + '\', this)">';
            profileHTML += '<div class="photo-status" id="photo-status-' + user.uid + '"></div>';
            profileHTML += '<input type="hidden" id="photoURL-' + user.uid + '" value="' + photoURL.replace(/"/g, '&quot;') + '">';
            profileHTML += '</div></div>';

            profileHTML += '<label class="section-label" for="songs-' + user.uid + '">Songs (one per line)</label>';
            profileHTML += '<p class="hint" style="margin-top:0">These are songs this person can sing. Edit freely — as many as you want.</p>';
            profileHTML += '<textarea class="admin-edit-area" id="songs-' + user.uid + '" rows="5" placeholder="Amazing Grace\nHow Great Thou Art">' + songs.map(function(s){ return String(s).replace(/</g,'&lt;'); }).join('\n') + '</textarea>';

            profileHTML += '<label class="section-label" for="groups-' + user.uid + '">Music groups (unlimited — one per line)</label>';
            profileHTML += '<p class="hint" style="margin-top:0">Add as many groups as needed, same as songs. Example: Reese Family, Youth Trio, Choir.</p>';
            profileHTML += '<textarea class="admin-edit-area" id="groups-' + user.uid + '" rows="5" placeholder="Reese Family\nYouth Trio\nChoir">' + groupNames.map(function(s){ return String(s).replace(/</g,'&lt;'); }).join('\n') + '</textarea>';

            profileHTML += '</div>';

            const roleBadge = user.role === 'admin'
                ? '<span class="badge admin">Admin</span>'
                : (user.role === 'leader' ? '<span class="badge leader">Leader</span>' : '');

            div.innerHTML = `
                <div class="user-header">
                    <div>
                        <div class="user-name">${user.name || 'No name'}${roleBadge}</div>
                        <div class="user-email">${user.email || ''}</div>
                    </div>
                    <div style="text-align:right;font-size:0.85rem;">
                        <div><strong>Role:</strong> ${user.role || 'member'}</div>
                        ${leaderOf.length ? `<div style="color:#4cb8b9;"><strong>Leads:</strong> ${leaderOf.join(', ')}</div>` : ''}
                    </div>
                </div>

                ${profileHTML}

                <label class="section-label" for="role-${user.uid}">Role</label>
                <select class="role-select" id="role-${user.uid}" onchange="toggleLeaderSection('${user.uid}')">
                    <option value="member" ${user.role === 'member' ? 'selected' : ''}>Member (Regular User)</option>
                    <option value="leader" ${user.role === 'leader' ? 'selected' : ''}>Leader</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>

                <label class="section-label">Ministry Chats (what they can see in chat)</label>
                <p class="hint">Whole Church is always included.</p>
                ${ministryHTML}

                <div class="leader-box" id="leader-section-${user.uid}" style="display:${user.role === 'leader' || user.role === 'admin' || leaderOf.length ? 'block' : 'none'};">
                    <label class="section-label" style="margin-top:0;">Leader of (calendar events)</label>
                    <p class="hint">Leaders can create calendar events only for the ministries checked here. Admins can always create for any ministry.</p>
                    ${leaderHTML}
                </div>

                <label class="section-label" for="approved-${user.uid}">Approval Status</label>
                <select class="role-select" id="approved-${user.uid}">
                    <option value="true" ${user.approved ? 'selected' : ''}>Approved</option>
                    <option value="false" ${!user.approved ? 'selected' : ''}>Pending Approval</option>
                </select>

                <button class="save-btn" onclick="saveUser('${user.uid}')">Save Changes</button>
            `;
            return div;
        }

        window.adminUploadPhoto = async function(uid, input) {
            const status = document.getElementById('photo-status-' + uid);
            const file = input && input.files && input.files[0];
            if (!file) return;
            if (!file.type || file.type.indexOf('image/') !== 0) {
                if (status) status.textContent = 'Please choose an image file.';
                return;
            }
            try {
                if (status) status.textContent = 'Uploading…';
                const blob = await new Promise(function(resolve, reject) {
                    const reader = new FileReader();
                    reader.onerror = function() { reject(new Error('Could not read photo')); };
                    reader.onload = function() {
                        const img = new Image();
                        img.onerror = function() { reject(new Error('Could not load photo')); };
                        img.onload = function() {
                            const max = 1200;
                            let w = img.width, h = img.height;
                            if (w > max || h > max) {
                                if (w > h) { h = Math.round(h * max / w); w = max; }
                                else { w = Math.round(w * max / h); h = max; }
                            }
                            const canvas = document.createElement('canvas');
                            canvas.width = w; canvas.height = h;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, w, h);
                            canvas.toBlob(function(b) {
                                if (!b) reject(new Error('Could not process photo'));
                                else resolve(b);
                            }, 'image/jpeg', 0.85);
                        };
                        img.src = reader.result;
                    };
                    reader.readAsDataURL(file);
                });
                const path = 'profile-pics/' + uid + '/avatar.jpg';
                const ref = storage.ref(path);
                await ref.put(blob, { contentType: 'image/jpeg' });
                const url = await ref.getDownloadURL();
                await db.collection('users').doc(uid).set({
                    photoURL: url,
                    photoPath: path,
                    photoUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                const hidden = document.getElementById('photoURL-' + uid);
                if (hidden) hidden.value = url;
                const imgEl = document.getElementById('avatar-img-' + uid);
                const ph = document.getElementById('avatar-ph-' + uid);
                if (imgEl) { imgEl.src = url; imgEl.style.display = 'block'; }
                if (ph) ph.style.display = 'none';
                if (status) status.textContent = 'Photo saved.';
            } catch (err) {
                console.error(err);
                if (status) status.textContent = 'Error: ' + (err.message || err);
                alert('Photo upload failed: ' + (err.message || err));
            }
        };

        window.toggleLeaderSection = function(uid) {
            const role = document.getElementById('role-' + uid).value;
            const section = document.getElementById('leader-section-' + uid);
            if (section) {
                if (role === 'leader' || role === 'admin') section.style.display = 'block';
            }
        };

        window.saveUser = async function(uid) {
            const role = document.getElementById('role-' + uid).value;
            const approvedEl = document.getElementById('approved-' + uid);
            const approved = approvedEl ? approvedEl.value === 'true' : false;

            const ministries = [];
            document.querySelectorAll('input[data-field="ministries"][data-uid="' + uid + '"]').forEach(cb => {
                if (cb.checked || cb.disabled) ministries.push(cb.value);
            });
            if (!ministries.includes('Whole Church')) ministries.unshift('Whole Church');

            const leaderOf = [];
            document.querySelectorAll('input[data-field="leaderOf"][data-uid="' + uid + '"]').forEach(cb => {
                if (cb.checked) leaderOf.push(cb.value);
            });

            const nameEl = document.getElementById('name-' + uid);
            const birthdayEl = document.getElementById('birthday-' + uid);
            const joinedEl = document.getElementById('joined-' + uid);
            const phoneEl = document.getElementById('phone-' + uid);
            const addressEl = document.getElementById('address-' + uid);
            const songsEl = document.getElementById('songs-' + uid);
            const groupsEl = document.getElementById('groups-' + uid);
            const photoURLEl = document.getElementById('photoURL-' + uid);

            function linesToList(el) {
                if (!el) return [];
                return String(el.value || '').split(/\n|,/).map(function(s){ return s.trim(); }).filter(Boolean);
            }
            const songs = linesToList(songsEl);
            const musicGroupNames = linesToList(groupsEl);

            try {
                const payload = {
                    role: role,
                    ministries: ministries,
                    leaderOf: leaderOf,
                    approved: approved,
                    name: nameEl ? nameEl.value.trim() : '',
                    birthday: birthdayEl ? birthdayEl.value : '',
                    churchJoinedYear: joinedEl ? String(joinedEl.value || '').trim() : '',
                    phone: phoneEl ? phoneEl.value.trim() : '',
                    address: addressEl ? addressEl.value.trim() : '',
                    songs: songs,
                    musicGroupNames: musicGroupNames
                };
                if (photoURLEl && photoURLEl.value) payload.photoURL = photoURLEl.value;
                await db.collection('users').doc(uid).set(payload, { merge: true });
                alert('User updated successfully!');
                loadUsers();
            } catch (err) {
                alert('Error saving: ' + err.message);
            }
        };

        auth.onAuthStateChanged(async function(user) {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            const profile = await getUserProfile(user.uid);
            if (!profile || profile.role !== 'admin') {
                alert('Access denied. Admins only.');
                window.location.href = 'index.html';
                return;
            }
            var search = document.getElementById('adminSearch');
            if (search && !search.dataset.bound) {
                search.dataset.bound = '1';
                search.addEventListener('input', filterAdminUsers);
            }
            loadUsers();
        });
