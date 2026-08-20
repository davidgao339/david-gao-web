document.addEventListener('DOMContentLoaded', () => {
    
    const uploadCard = document.getElementById('upload-card');
    const demoBtn = document.getElementById('demo-btn');
    const processingState = document.getElementById('processing-state');
    const processText = document.getElementById('process-text');
    const progressBar = document.getElementById('progress-bar');
    
    const uploadView = document.getElementById('upload-view');
    const dashboardView = document.getElementById('dashboard-view');
    const scheduleBody = document.getElementById('schedule-body');
    const navWeekly = document.getElementById('nav-weekly');
    const navEmployees = document.getElementById('nav-employees');
    const navAnalytics = document.getElementById('nav-analytics');
    const scheduleArea = document.getElementById('schedule-area');
    const employeesArea = document.getElementById('employees-area');
    const analyticsArea = document.getElementById('analytics-area');
    const employeesGrid = document.getElementById('employees-grid');
    
    let currentWeekStartDay = 0; // 0-indexed day for Oct (max is 24)

    // Mock Excel Data transformation
    // Generate Mock Data for 31 days
    const employeesBase = [
        { name: 'Sarah J.', role: 'Driver', initials: 'SJ', type: 'manager' },
        { name: 'David G.', role: 'Sorter', initials: 'DG', type: 'barista' },
        { name: 'Elena R.', role: 'Sorter', initials: 'ER', type: 'barista' },
        { name: 'Mike T.', role: 'Greeter', initials: 'MT', type: 'kitchen' },
        { name: 'Anna K.', role: 'Event Staff', initials: 'AK', type: 'cashier' }
    ];

    const mockData = employeesBase.map(emp => {
        const shifts = [];
        for(let i=0; i<31; i++) {
            // roughly 5 out of 7 days they work
            if (Math.random() < 0.7) {
                let start = emp.type === 'manager' ? '07:00 AM' : (Math.random() > 0.5 ? '08:00 AM' : '12:00 PM');
                let end = start === '07:00 AM' ? '03:00 PM' : (start === '08:00 AM' ? '04:00 PM' : '08:00 PM');
                shifts.push({ day: i, start, end });
            }
        }
        return { ...emp, shifts };
    });

    if(demoBtn) {
        demoBtn.addEventListener('click', startTransformationFlow);
    }

    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');

    if(prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            if (currentWeekStartDay > 0) {
                currentWeekStartDay = Math.max(0, currentWeekStartDay - 7);
                renderSchedule();
            }
        });
    }

    if(nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            if (currentWeekStartDay < 24) {
                currentWeekStartDay = Math.min(24, currentWeekStartDay + 7);
                renderSchedule();
            }
        });
    }
    
    // Mobile Menu Toggle
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if(menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Toast Notification Helper
    function showToast(message) {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span class="material-icons" style="color: var(--primary-color)">check_circle</span> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // New Shift Modal Logic
    const newShiftBtn = document.getElementById('new-shift-btn');
    const modal = document.getElementById('new-shift-modal');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const modalSave = document.getElementById('modal-save');
    
    if (newShiftBtn) {
        newShiftBtn.addEventListener('click', () => {
            // Default to the first day of the currently viewed week
            document.getElementById('shift-day').value = currentWeekStartDay + 1;
            modal.style.display = 'flex';
        });
    }

    const closeModal = () => {
        if(modal) modal.style.display = 'none';
    };

    if(modalClose) modalClose.addEventListener('click', closeModal);
    if(modalCancel) modalCancel.addEventListener('click', closeModal);

    if(modalSave) {
        modalSave.addEventListener('click', () => {
            const volIdx = parseInt(document.getElementById('shift-volunteer').value);
            const day = parseInt(document.getElementById('shift-day').value) - 1; // 0-indexed
            
            // Add mock shift
            mockData[volIdx].shifts.push({
                day: day,
                start: '09:00 AM',
                end: '05:00 PM'
            });
            
            closeModal();
            renderSchedule();
            if(employeesArea.style.display === 'flex') renderEmployees();
            if(analyticsArea.style.display === 'flex') renderAnalytics();
            
            showToast('New shift successfully assigned.');
        });
    }

    // Add Employee Modal Logic
    const addEmpBtn = document.getElementById('add-employee-btn');
    const empModal = document.getElementById('add-employee-modal');
    const empModalClose = document.getElementById('emp-modal-close');
    const empModalCancel = document.getElementById('emp-modal-cancel');
    const empModalSave = document.getElementById('emp-modal-save');
    
    if (addEmpBtn) {
        addEmpBtn.addEventListener('click', () => {
            const empNameInput = document.getElementById('emp-name');
            if (empNameInput) empNameInput.value = '';
            if (empModal) empModal.style.display = 'flex';
        });
    }

    const closeEmpModal = () => {
        if(empModal) empModal.style.display = 'none';
    };

    if(empModalClose) empModalClose.addEventListener('click', closeEmpModal);
    if(empModalCancel) empModalCancel.addEventListener('click', closeEmpModal);

    if(empModalSave) {
        empModalSave.addEventListener('click', () => {
            const nameInput = document.getElementById('emp-name');
            const roleSelect = document.getElementById('emp-role');
            
            if (!nameInput || !roleSelect) return;
            
            const name = nameInput.value || 'New Vol.';
            const roleVal = roleSelect.value.split(',');
            const role = roleVal[0];
            const type = roleVal[1] || 'manager';
            
            // Get initials from name
            const words = name.trim().split(' ');
            let initials = '';
            if (words.length >= 2) {
                initials = words[0][0] + words[1][0];
            } else if (words.length === 1 && words[0].length > 0) {
                initials = words[0].substring(0, 2);
            } else {
                initials = 'NV';
            }
            initials = initials.toUpperCase();
            
            // Add mock employee
            mockData.push({
                name: name,
                role: role,
                initials: initials,
                type: type,
                shifts: []
            });
            
            // Also add to select dropdown in shift modal
            const shiftVolSelect = document.getElementById('shift-volunteer');
            if (shiftVolSelect) {
                const opt = document.createElement('option');
                opt.value = mockData.length - 1;
                opt.text = `${name} (${role})`;
                shiftVolSelect.appendChild(opt);
            }
            
            closeEmpModal();
            if(scheduleArea.style.display === 'flex' || scheduleArea.style.display === '') renderSchedule();
            if(employeesArea.style.display === 'flex') renderEmployees();
            if(analyticsArea.style.display === 'flex') renderAnalytics();
            
            showToast(`${name} added to volunteer roster.`);
        });
    }

    navWeekly.addEventListener('click', () => {
        navWeekly.classList.add('active');
        navEmployees.classList.remove('active');
        navAnalytics.classList.remove('active');
        scheduleArea.style.display = 'flex';
        employeesArea.style.display = 'none';
        analyticsArea.style.display = 'none';
    });

    navEmployees.addEventListener('click', () => {
        navEmployees.classList.add('active');
        navWeekly.classList.remove('active');
        navAnalytics.classList.remove('active');
        scheduleArea.style.display = 'none';
        employeesArea.style.display = 'flex';
        analyticsArea.style.display = 'none';
        renderEmployees();
    });

    navAnalytics.addEventListener('click', () => {
        navAnalytics.classList.add('active');
        navWeekly.classList.remove('active');
        navEmployees.classList.remove('active');
        scheduleArea.style.display = 'none';
        employeesArea.style.display = 'none';
        analyticsArea.style.display = 'flex';
        renderAnalytics();
    });

    function renderAnalytics() {
        const topContributors = document.getElementById('top-contributors');
        if (!topContributors) return;
        
        // Sort employees by number of shifts
        const sorted = [...mockData].sort((a, b) => b.shifts.length - a.shifts.length);
        
        topContributors.innerHTML = '';
        sorted.slice(0, 3).forEach((emp, index) => {
            const hours = emp.shifts.length * 8; // mock 8hr shifts
            topContributors.innerHTML += `
                <div class="contributor-row stagger-in" style="animation-delay: ${index * 0.1}s">
                    <div class="employee-avatar ${emp.type}">${emp.initials}</div>
                    <div class="contributor-info">
                        <div class="contributor-name">${emp.name}</div>
                        <div class="contributor-role">${emp.role}</div>
                    </div>
                    <div class="contributor-hours">${hours}h</div>
                </div>
            `;
        });
    }

    function startTransformationFlow() {
        // Hide upload card, show processing state
        uploadCard.style.display = 'none';
        processingState.style.display = 'flex';

        // Animate processing steps to simulate Excel parsing
        setTimeout(() => {
            progressBar.style.width = '30%';
            processText.innerText = 'Extracting Columns...';
        }, 500);

        setTimeout(() => {
            progressBar.style.width = '60%';
            processText.innerText = 'Mapping Employee Roles...';
        }, 1200);

        setTimeout(() => {
            progressBar.style.width = '100%';
            processText.innerText = 'Generating Visual Schedule...';
        }, 2000);

        setTimeout(() => {
            showDashboard();
        }, 2500);
    }

    function showDashboard() {
        uploadView.classList.remove('active');
        dashboardView.classList.add('active');
        renderSchedule();
    }

    function renderSchedule() {
        scheduleBody.innerHTML = '';
        
        // Build Header dynamically for 7 days
        const gridHeader = document.getElementById('grid-header');
        if (gridHeader) {
            gridHeader.innerHTML = '<div class="cell header-cell empty-cell">Employees</div>';
            for(let i = 0; i < 7; i++) {
                const dayNum = currentWeekStartDay + i + 1;
                gridHeader.innerHTML += `<div class="cell header-cell">Oct ${dayNum}</div>`;
            }
        }
        
        // Update header text
        const currentRangeEl = document.getElementById('current-date-range');
        if (currentRangeEl) {
            currentRangeEl.innerText = `Oct ${currentWeekStartDay + 1} - Oct ${currentWeekStartDay + 7}`;
        }

        mockData.forEach((employee, index) => {
            const row = document.createElement('div');
            row.className = 'employee-row stagger-in';
            row.style.animationDelay = `${index * 0.1}s`;

            // Employee Info Cell
            let rowHtml = `
                <div class="employee-info">
                    <div class="employee-avatar ${employee.type}">${employee.initials}</div>
                    <div class="employee-details">
                        <span class="employee-name">${employee.name}</span>
                        <span class="employee-role">${employee.role}</span>
                    </div>
                </div>
            `;

            // 7 Days
            for (let i = 0; i < 7; i++) {
                const currentDay = currentWeekStartDay + i;
                const dayShifts = employee.shifts.filter(s => s.day === currentDay);
                let cellHtml = `<div class="day-cell" data-emp-idx="${index}" data-day="${currentDay}">`;
                
                if (dayShifts.length > 0) {
                    const isConflict = dayShifts.length > 1;
                    
                    dayShifts.forEach(shift => {
                        cellHtml += `
                            <div class="shift-card role-${employee.type} ${isConflict ? 'conflict' : ''}" draggable="true" data-emp-idx="${index}" data-day="${currentDay}" data-start="${shift.start}">
                                ${isConflict ? '<div class="conflict-icon"><span class="material-icons" style="font-size:12px;">warning</span></div>' : ''}
                                <div class="shift-time">${shift.start} - ${shift.end}</div>
                                <div class="shift-role">${employee.role}</div>
                            </div>
                        `;
                    });
                }
                
                cellHtml += '</div>';
                rowHtml += cellHtml;
            }

            row.innerHTML = rowHtml;
            scheduleBody.appendChild(row);
        });
        
        attachDragAndDrop();
    }

    function renderEmployees() {
        employeesGrid.innerHTML = '';
        
        mockData.forEach((employee, index) => {
            const card = document.createElement('div');
            card.className = 'employee-card stagger-in';
            card.style.animationDelay = `${index * 0.1}s`;

            const hours = employee.shifts.length * 8; // mock calculation

            card.innerHTML = `
                <div class="employee-avatar ${employee.type}">${employee.initials}</div>
                <div class="employee-name">${employee.name}</div>
                <div class="employee-role">${employee.role}</div>
                <div class="employee-stats">
                    <div class="stat">
                        <span class="stat-value">${employee.shifts.length}</span>
                        <span class="stat-label">Shifts</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${hours}h</span>
                        <span class="stat-label">Hours</span>
                    </div>
                </div>
            `;
            employeesGrid.appendChild(card);
        });
    }
    
    // Drag and Drop Logic
    let draggedShift = null;
    
    function attachDragAndDrop() {
        const shiftCards = document.querySelectorAll('.shift-card');
        const dayCells = document.querySelectorAll('.day-cell');
        
        shiftCards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                draggedShift = {
                    empIdx: parseInt(card.getAttribute('data-emp-idx')),
                    day: parseInt(card.getAttribute('data-day')),
                    start: card.getAttribute('data-start')
                };
                setTimeout(() => card.classList.add('dragging'), 0);
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                draggedShift = null;
            });
        });
        
        dayCells.forEach(cell => {
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                cell.classList.add('drag-over');
            });
            cell.addEventListener('dragleave', () => {
                cell.classList.remove('drag-over');
            });
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                cell.classList.remove('drag-over');
                
                if(!draggedShift) return;
                
                const targetEmpIdx = parseInt(cell.getAttribute('data-emp-idx'));
                const targetDay = parseInt(cell.getAttribute('data-day'));
                
                // If dropped on the same person on the same day, ignore
                if(targetEmpIdx === draggedShift.empIdx && targetDay === draggedShift.day) return;
                
                // Find and remove original shift
                const emp = mockData[draggedShift.empIdx];
                const shiftIndex = emp.shifts.findIndex(s => s.day === draggedShift.day && s.start === draggedShift.start);
                
                if (shiftIndex > -1) {
                    const shiftToMove = emp.shifts.splice(shiftIndex, 1)[0];
                    shiftToMove.day = targetDay;
                    mockData[targetEmpIdx].shifts.push(shiftToMove);
                    
                    showToast('Shift reassigned successfully.');
                    renderSchedule();
                }
            });
        });
    }

    // Export Data Logic
    const exportBtn = document.getElementById('nav-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            let csv = "Name,Role,Day (Oct),Start,End\\n";
            mockData.forEach(emp => {
                emp.shifts.forEach(shift => {
                    csv += `"${emp.name}","${emp.role}",${shift.day + 1},"${shift.start}","${shift.end}"\\n`;
                });
            });
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'schedule_export.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('Schedule exported to CSV.');
        });
    }
});
