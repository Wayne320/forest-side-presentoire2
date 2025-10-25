
import React, { useState, useMemo } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { LOCAL_STORAGE_KEY, INITIAL_SCHEDULE_DATA } from './constants';
import { ScheduleData, Day, EditingSlot, EditingNameInfo, NotificationState } from './types';
import Modal from './components/Modal';
import Notification from './components/Notification';
import { CalendarWeekIcon, PersonLockIcon, CalendarCheckIcon, PencilIcon, PlusCircleIcon, TrashIcon } from './components/icons';

const App: React.FC = () => {
    const [scheduleData, setScheduleData] = useLocalStorage<ScheduleData>(LOCAL_STORAGE_KEY, INITIAL_SCHEDULE_DATA);
    const [currentLocation, setCurrentLocation] = useState<string>(scheduleData.locations[0] || '');
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
    
    // Modals State
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const [isAddNameModalOpen, setAddNameModalOpen] = useState(false);
    const [isEditNameModalOpen, setEditNameModalOpen] = useState(false);
    const [isEditLocationModalOpen, setEditLocationModalOpen] = useState(false);
    const [isEditTimeSlotModalOpen, setEditTimeSlotModalOpen] = useState(false);
    
    // Editing State
    const [editingSlot, setEditingSlot] = useState<EditingSlot | null>(null);
    const [editingNameInfo, setEditingNameInfo] = useState<EditingNameInfo | null>(null);
    const [editingLocationIndex, setEditingLocationIndex] = useState<number | null>(null);
    const [editingTimeSlotIndex, setEditingTimeSlotIndex] = useState<number | null>(null);
    
    const [nameInput, setNameInput] = useState('');
    const [editNameInput, setEditNameInput] = useState('');
    const [editLocationInput, setEditLocationInput] = useState('');
    const [editTimeSlotInput, setEditTimeSlotInput] = useState('');

    const [notification, setNotification] = useState<NotificationState>({ message: '', type: 'success', visible: false });

    const weekInfo = useMemo(() => {
        const getWeekNumber = (date: Date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };
        const formatDate = (date: Date) => date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
        return {
            weekNumber: getWeekNumber(new Date()),
            startDate: formatDate(monday),
            endDate: formatDate(sunday)
        };
    }, []);

    const showNotification = (message: string, type: NotificationState['type'] = 'success') => {
        setNotification({ message, type, visible: true });
    };

    // Handlers
    const handleLogin = (pass: string) => {
        if (pass === '3202') { // Simplified login
            setIsAdminLoggedIn(true);
            setLoginModalOpen(false);
            showNotification('Logged in as admin', 'success');
        } else {
            showNotification('Invalid password', 'error');
        }
    };

    const handleLogout = () => {
        setIsAdminLoggedIn(false);
        showNotification('Logged out successfully');
    };

    const addNameToSlot = () => {
        if (!nameInput.trim() || !editingSlot) return;
        setScheduleData(prev => {
            const newData = { ...prev };
            const names = newData.schedule[editingSlot.location][editingSlot.time][editingSlot.day];
            if (names.length >= 3) {
                showNotification('Maximum 3 names per slot', 'warning');
                return prev;
            }
            names.push(nameInput.trim());
            return newData;
        });
        showNotification('Name added successfully');
        setNameInput('');
        setAddNameModalOpen(false);
    };

    const removeNameFromSlot = (info: EditingNameInfo) => {
        setScheduleData(prev => {
            const newData = JSON.parse(JSON.stringify(prev)); // Deep copy
            newData.schedule[info.location][info.time][info.day].splice(info.index, 1);
            return newData;
        });
        showNotification('Name removed');
    };
    
    const updateNameInSlot = () => {
        if (!editNameInput.trim() || !editingNameInfo) return;
        setScheduleData(prev => {
            const newData = { ...prev };
            newData.schedule[editingNameInfo.location][editingNameInfo.time][editingNameInfo.day][editingNameInfo.index] = editNameInput.trim();
            return newData;
        });
        showNotification('Name updated');
        setEditNameInput('');
        setEditNameModalOpen(false);
    };

    const openAddNameModal = (slot: EditingSlot) => {
        setEditingSlot(slot);
        setAddNameModalOpen(true);
    };

    const openEditNameModal = (info: EditingNameInfo) => {
        setEditingNameInfo(info);
        setEditNameInput(scheduleData.schedule[info.location][info.time][info.day][info.index]);
        setEditNameModalOpen(true);
    };

    const openEditLocationModal = (index: number) => {
        setEditingLocationIndex(index);
        setEditLocationInput(scheduleData.locations[index]);
        setEditLocationModalOpen(true);
    };

    const openEditTimeSlotModal = (index: number) => {
        setEditingTimeSlotIndex(index);
        setEditTimeSlotInput(scheduleData.timeSlots[index]);
        setEditTimeSlotModalOpen(true);
    };
    
    // Admin Panel Functions
    const addLocation = (newLocation: string) => {
        if (!newLocation.trim() || scheduleData.locations.includes(newLocation.trim())) {
            showNotification('Invalid or duplicate location', 'error');
            return;
        }
        setScheduleData(prev => {
            const updatedLocations = [...prev.locations, newLocation.trim()];
            const newSchedule = JSON.parse(JSON.stringify(prev.schedule));
            newSchedule[newLocation.trim()] = {};
            prev.timeSlots.forEach(ts => {
                newSchedule[newLocation.trim()][ts] = {} as Record<Day, string[]>;
                prev.days.forEach(day => {
                    newSchedule[newLocation.trim()][ts][day] = [];
                });
            });
            return { ...prev, locations: updatedLocations, schedule: newSchedule };
        });
        showNotification('Location added');
    };
    
    const removeLocation = (index: number) => {
        if (scheduleData.locations.length <= 1) {
            showNotification('Cannot remove the last location', 'warning');
            return;
        }
        const locationToRemove = scheduleData.locations[index];
        setScheduleData(prev => {
            const updatedLocations = prev.locations.filter((_, i) => i !== index);
            const newSchedule = { ...prev.schedule };
            delete newSchedule[locationToRemove];
            return { ...prev, locations: updatedLocations, schedule: newSchedule };
        });
        if(currentLocation === locationToRemove) {
            setCurrentLocation(scheduleData.locations.filter((_, i) => i !== index)[0]);
        }
        showNotification('Location removed');
    };

    const updateLocation = () => {
        if (editingLocationIndex === null || !editLocationInput.trim()) return;
        const oldLocation = scheduleData.locations[editingLocationIndex];
        const newLocation = editLocationInput.trim();
        if(scheduleData.locations.includes(newLocation) && oldLocation !== newLocation) {
            showNotification("Location already exists", 'warning');
            return;
        }

        setScheduleData(prev => {
            const updatedLocations = [...prev.locations];
            updatedLocations[editingLocationIndex] = newLocation;
            
            const newSchedule = { ...prev.schedule };
            if (oldLocation !== newLocation) {
                newSchedule[newLocation] = newSchedule[oldLocation];
                delete newSchedule[oldLocation];
            }
            return { ...prev, locations: updatedLocations, schedule: newSchedule };
        });
        if (currentLocation === oldLocation) {
            setCurrentLocation(newLocation);
        }
        showNotification('Location updated');
        setEditLocationModalOpen(false);
    };

    const addTimeSlot = (newTimeSlot: string) => {
        if (!newTimeSlot.trim() || scheduleData.timeSlots.includes(newTimeSlot.trim())) {
             showNotification('Invalid or duplicate time slot', 'error');
            return;
        }
        setScheduleData(prev => {
            const updatedTimeSlots = [...prev.timeSlots, newTimeSlot.trim()];
            const newSchedule = { ...prev.schedule };
            Object.keys(newSchedule).forEach(loc => {
                newSchedule[loc][newTimeSlot.trim()] = {} as Record<Day, string[]>;
                prev.days.forEach(day => {
                    newSchedule[loc][newTimeSlot.trim()][day] = [];
                });
            });
            return { ...prev, timeSlots: updatedTimeSlots, schedule: newSchedule };
        });
        showNotification('Time slot added');
    };

    const removeTimeSlot = (index: number) => {
        const timeSlotToRemove = scheduleData.timeSlots[index];
        setScheduleData(prev => {
            const updatedTimeSlots = prev.timeSlots.filter((_, i) => i !== index);
            const newSchedule = { ...prev.schedule };
            Object.keys(newSchedule).forEach(loc => {
                delete newSchedule[loc][timeSlotToRemove];
            });
            return { ...prev, timeSlots: updatedTimeSlots, schedule: newSchedule };
        });
        showNotification('Time slot removed');
    };

    const updateTimeSlot = () => {
        if (editingTimeSlotIndex === null || !editTimeSlotInput.trim()) return;
        const oldTimeSlot = scheduleData.timeSlots[editingTimeSlotIndex];
        const newTimeSlot = editTimeSlotInput.trim();
        if(scheduleData.timeSlots.includes(newTimeSlot) && oldTimeSlot !== newTimeSlot) {
            showNotification("Time slot already exists", 'warning');
            return;
        }

        setScheduleData(prev => {
            const updatedTimeSlots = [...prev.timeSlots];
            updatedTimeSlots[editingTimeSlotIndex] = newTimeSlot;

            const newSchedule = { ...prev.schedule };
            if (oldTimeSlot !== newTimeSlot) {
                Object.keys(newSchedule).forEach(loc => {
                    newSchedule[loc][newTimeSlot] = newSchedule[loc][oldTimeSlot];
                    delete newSchedule[loc][oldTimeSlot];
                });
            }
            return { ...prev, timeSlots: updatedTimeSlots, schedule: newSchedule };
        });
        showNotification('Time slot updated');
        setEditTimeSlotModalOpen(false);
    };


    return (
        <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] min-h-screen p-2 sm:p-4">
            <div className="container mx-auto max-w-7xl bg-white/95 rounded-xl shadow-2xl p-4 sm:p-6">
                
                {/* Header */}
                <header className="flex flex-wrap justify-between items-center mb-5 pb-4 border-b-2 border-gray-200 gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#4361ee] flex-grow min-w-[200px]">
                        <CalendarWeekIcon />
                        Forest Side Presentoire
                    </h1>
                    <button 
                        onClick={() => isAdminLoggedIn ? handleLogout() : setLoginModalOpen(true)}
                        className="bg-[#4361ee] hover:bg-[#3f37c9] text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 whitespace-nowrap"
                    >
                        <PersonLockIcon />
                        {isAdminLoggedIn ? 'Logout' : 'Admin'}
                    </button>
                </header>
                
                {/* Week Info */}
                <div className="flex flex-wrap items-center mb-5 p-3 sm:p-4 bg-gray-100 rounded-lg shadow-inner gap-x-4 gap-y-2">
                    <div className="font-semibold text-[#4361ee] text-sm sm:text-base">Current Week:</div>
                    <div className="text-sm sm:text-base text-gray-800 flex-grow min-w-[220px]">Week {weekInfo.weekNumber} ({weekInfo.startDate} - {weekInfo.endDate})</div>
                    <div className="bg-[#06ffa5] text-gray-800 text-xs sm:text-sm font-bold px-3 py-1 rounded-full flex items-center">
                       <CalendarCheckIcon/> This Week
                    </div>
                </div>

                {/* Location Tabs */}
                <div className="mb-5 border-b-2 border-gray-200">
                    <div className="flex overflow-x-auto -mb-0.5">
                        {scheduleData.locations.map(loc => (
                            <button key={loc} onClick={() => setCurrentLocation(loc)}
                                className={`py-3 px-4 text-sm sm:text-base text-center font-medium border-b-4 transition-colors duration-300 whitespace-normal flex-shrink-0 leading-tight
                                ${currentLocation === loc ? 'border-[#4361ee] text-[#4361ee]' : 'border-transparent text-gray-600 hover:bg-blue-50'}`}
                            >
                                {loc}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Schedule Table */}
                <div className="overflow-x-auto rounded-lg shadow-md mb-5">
                    <table className="w-full min-w-[700px] border-collapse">
                        <thead>
                            <tr>
                                {['Time', ...scheduleData.days].map(header => (
                                    <th key={header} className="bg-[#4361ee] text-white p-2 text-xs sm:text-sm font-semibold tracking-wider text-center sticky top-0 z-10">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {scheduleData.timeSlots.map(timeSlot => (
                                <tr key={timeSlot} className="even:bg-gray-50">
                                    <td className="border border-gray-200 p-2 text-center font-semibold text-xs sm:text-sm text-gray-700">{timeSlot}</td>
                                    {scheduleData.days.map(day => {
                                        const names = scheduleData.schedule[currentLocation]?.[timeSlot]?.[day] || [];
                                        return (
                                            <td key={day} className="border border-gray-200 p-1 sm:p-2 text-center align-top min-h-[70px]">
                                                <div className="flex flex-col items-center gap-1">
                                                    {names.map((name, index) => (
                                                        <div key={index} className="group relative w-full">
                                                            <span className="inline-block bg-[#4361ee] text-white text-xs px-2 py-1 rounded-full break-words w-full">
                                                                {name}
                                                            </span>
                                                            {isAdminLoggedIn && (
                                                                <div className="absolute top-1/2 -translate-y-1/2 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => openEditNameModal({location: currentLocation, time: timeSlot, day, index})} className="text-white hover:text-yellow-300"><PencilIcon/></button>
                                                                    <button onClick={() => removeNameFromSlot({location: currentLocation, time: timeSlot, day, index})} className="text-white hover:text-red-300 font-bold">×</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {names.length < 3 && (
                                                        <button onClick={() => openAddNameModal({location: currentLocation, time: timeSlot, day})}
                                                            className="bg-[#06ffa5] hover:bg-green-400 text-gray-800 text-xs font-bold py-1 px-2 rounded-md transition-transform transform hover:scale-105 mt-1"
                                                        >
                                                            + Nom
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Admin Panel */}
                {isAdminLoggedIn && (
                    <div className="bg-white rounded-lg p-6 shadow-lg mt-8 border border-gray-200">
                        <h2 className="text-2xl font-bold text-[#4361ee] mb-6">Admin Panel</h2>
                        
                        {/* Manage Locations */}
                        <div className="mb-8 p-4 border rounded-md">
                            <h3 className="text-lg font-semibold mb-3">Manage Locations</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {scheduleData.locations.map((loc, index) => (
                                    <div key={loc} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                        <span>{loc}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditLocationModal(index)} className="text-sm p-1 rounded hover:bg-yellow-200"><PencilIcon /></button>
                                            <button onClick={() => removeLocation(index)} className="text-sm p-1 rounded hover:bg-red-200"><TrashIcon/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <input id="new-location-input" type="text" placeholder="New location" className="flex-grow p-2 border rounded-md"/>
                                <button onClick={() => addLocation((document.getElementById('new-location-input') as HTMLInputElement).value)} className="bg-[#4361ee] text-white p-2 rounded-md hover:bg-[#3f37c9]"><PlusCircleIcon/> Add</button>
                            </div>
                        </div>

                        {/* Manage Time Slots */}
                        <div className="p-4 border rounded-md">
                            <h3 className="text-lg font-semibold mb-3">Manage Time Slots</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {scheduleData.timeSlots.map((ts, index) => (
                                    <div key={ts} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                        <span>{ts}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditTimeSlotModal(index)} className="text-sm p-1 rounded hover:bg-yellow-200"><PencilIcon/></button>
                                            <button onClick={() => removeTimeSlot(index)} className="text-sm p-1 rounded hover:bg-red-200"><TrashIcon/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <input id="new-timeslot-input" type="text" placeholder="e.g., 18h00-19h30" className="flex-grow p-2 border rounded-md"/>
                                <button onClick={() => addTimeSlot((document.getElementById('new-timeslot-input') as HTMLInputElement).value)} className="bg-[#4361ee] text-white p-2 rounded-md hover:bg-[#3f37c9]"><PlusCircleIcon/> Add</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} title="Admin Login">
                <div className="space-y-4">
                    <p className="text-sm p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded">For security, credentials are not stored.</p>
                    <input id="password-input" type="password" placeholder="Password" className="w-full p-2 border rounded-md" onKeyPress={(e) => e.key === 'Enter' && handleLogin((e.target as HTMLInputElement).value)} />
                    <button onClick={() => handleLogin((document.getElementById('password-input') as HTMLInputElement).value)} className="w-full bg-[#4361ee] text-white p-2 rounded-md hover:bg-[#3f37c9]">Login</button>
                </div>
            </Modal>
            
            <Modal isOpen={isAddNameModalOpen} onClose={() => setAddNameModalOpen(false)} title="Add Name">
                <div className="space-y-4">
                    <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} type="text" placeholder="Enter name" className="w-full p-2 border rounded-md" autoFocus/>
                    <button onClick={addNameToSlot} className="w-full bg-[#4361ee] text-white p-2 rounded-md hover:bg-[#3f37c9]">Save</button>
                </div>
            </Modal>
            
            <Modal isOpen={isEditNameModalOpen} onClose={() => setEditNameModalOpen(false)} title="Edit Name">
                 <div className="space-y-4">
                    <input value={editNameInput} onChange={(e) => setEditNameInput(e.target.value)} type="text" placeholder="Enter new name" className="w-full p-2 border rounded-md" autoFocus/>
                    <button onClick={updateNameInSlot} className="w-full bg-[#4361ee] text-white p-2 rounded-md hover:bg-[#3f37c9]">Update</button>
                </div>
            </Modal>
            
            <Modal isOpen={isEditLocationModalOpen} onClose={() => setEditLocationModalOpen(false)} title="Edit Location">
                 <div className="space-y-4">
                    <input value={editLocationInput} onChange={(e) => setEditLocationInput(e.target.value)} type="text" placeholder="Enter new location name" className="w-full p-2 border rounded-md" autoFocus/>
                    <button onClick={updateLocation} className="w-full bg-[#4361ee] text-white p-2 rounded-md hover:bg-[#3f37c9]">Update</button>
                </div>
            </Modal>

            <Modal isOpen={isEditTimeSlotModalOpen} onClose={() => setEditTimeSlotModalOpen(false)} title="Edit Time Slot">
                 <div className="space-y-4">
                    <input value={editTimeSlotInput} onChange={(e) => setEditTimeSlotInput(e.target.value)} type="text" placeholder="Enter new time slot" className="w-full p-2 border rounded-md" autoFocus/>
                    <button onClick={updateTimeSlot} className="w-full bg-[#4361ee] text-white p-2 rounded-md hover:bg-[#3f37c9]">Update</button>
                </div>
            </Modal>

            <Notification notification={notification} onClose={() => setNotification(prev => ({ ...prev, visible: false }))} />
        </div>
    );
};

export default App;
