import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, serverTimestamp, query, orderBy, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { UserCog, X, Plus, Save, Loader2, ShieldCheck, AlertTriangle, KeyRound, Archive, ArrowLeft, Info, LogOut, Shield, Mail, FileDown, Trash2, Camera, Upload } from 'lucide-react';
import { jsPDF } from "jspdf";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDkUF1zg9-UdgxUYk89EtYGvrq2EFN_sZQ",
  authDomain: "rvr-rapport.firebaseapp.com",
  projectId: "rvr-rapport",
  storageBucket: "rvr-rapport.firebasestorage.app",
  messagingSenderId: "91875572439",
  appId: "1:91875572439:web:c3bf441eb04ebe653b0e92",
  measurementId: "G-132TJ4NRMG"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// --- Helper Components ---
const FormField = ({ label, name, value, onChange, type = "text", required = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input type={type} id={name} name={name} value={value} onChange={onChange} required={required} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"/>
    </div>
);

const CheckboxGroup = ({ legend, name, options, value, onChange }) => (
    <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">{legend}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {options.map(option => (
                <div key={option} className="flex items-center">
                    <input id={`${name}-${option}`} name={name} type="checkbox" value={option} checked={value.includes(option)} onChange={onChange} className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"/>
                    <label htmlFor={`${name}-${option}`} className="ml-2 block text-sm text-gray-900">{option}</label>
                </div>
            ))}
        </div>
    </fieldset>
);


// --- Main App Component ---
export default function App() {
    const [authUser, setAuthUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthUser(user);
            setIsAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (isAuthLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100"><Loader2 className="h-12 w-12 animate-spin text-red-600" /></div>;
    }
    
    return authUser ? <MainApp user={authUser} /> : <LoginScreen />;
}

// --- Login Screen Component ---
function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError('');
        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Innlogging feilet. Sjekk e-post og passord.');
            console.error(err);
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-red-600" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        RVR Rapport
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Vennligst logg inn for å fortsette
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                                placeholder="E-postadresse" />
                        </div>
                        <div>
                            <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                                placeholder="Passord" />
                        </div>
                    </div>
                     {error && (
                        <p className="text-sm text-center text-red-600">{error}</p>
                    )}
                    <div>
                        <button type="submit" disabled={isLoggingIn}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400">
                            {isLoggingIn ? <Loader2 className="animate-spin" /> : 'Logg inn'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Main Application Component (Protected) ---
function MainApp({ user }) {
    const initialFormState = {
        reportDate: new Date().toISOString().split('T')[0],
        startTime: new Date().toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }),
        locationAddress: '',
        municipality: 'Larvik',
        responseLeader: '',
        stakeholders: [{ name: '', type: 'Eier', phone: '', address: '', insurance: '' }],
        sector: [],
        buildingType: [],
        damageType: [],
        buildingFloors: '',
        damagedFloors: '',
        baseArea: '',
        damagedArea: '',
        damagedRooms: '',
        workPerformed: [],
        valuesSaved: '',
        damageDescription: '',
        personnelOnDuty: { station: '', count: '', hours: '' },
        personnelCalledIn: { station: '', count: '', hours: '' },
        equipmentUsed: [],
        images: [],
    };
    
    const [form, setForm] = useState(initialFormState);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState('');
    
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [tempAdminEmail, setTempAdminEmail] = useState('');
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [archivedReports, setArchivedReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isArchiveLoading, setIsArchiveLoading] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [lastError, setLastError] = useState(null);

    useEffect(() => {
        return () => {
            form.images.forEach(image => URL.revokeObjectURL(image.preview));
        };
    }, [form.images]);

    useEffect(() => {
        const initAppData = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, "rvrSettings", "config");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRecipientEmail(docSnap.data().recipientEmail);
                    setTempAdminEmail(docSnap.data().recipientEmail);
                } else {
                    await setDoc(docRef, { recipientEmail: "postmottak@larvik.brannvesen.no" });
                    setRecipientEmail("postmottak@larvik.brannvesen.no");
                    setTempAdminEmail("postmottak@larvik.brannvesen.no");
                }
            } catch (error) {
                console.error("Firestore read error:", error);
                setLastError(error);
                showModal("Feil", "Kunne ikke laste innstillinger.");
            } finally {
                setIsLoading(false);
            }
        };
        initAppData();
    }, [user]);

    const showModal = (title, message, onConfirm = null) => setModal({ isOpen: true, title, message, onConfirm });
    const closeModal = () => setModal({ isOpen: false, title: '', message: '', onConfirm: null });
    const handleConfirm = () => {
        if (modal.onConfirm) modal.onConfirm();
        closeModal();
    };

    const handleInputChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleCheckboxChange = (e) => {
        const { name, value, checked } = e.target;
        setForm(p => ({ ...p, [name]: checked ? [...p[name], value] : p[name].filter(i => i !== value) }));
    };
    const handleStakeholderChange = (index, e) => {
        const updated = [...form.stakeholders];
        updated[index][e.target.name] = e.target.value;
        setForm(p => ({ ...p, stakeholders: updated }));
    };
    const addStakeholder = () => setForm(p => ({ ...p, stakeholders: [...p.stakeholders, { name: '', type: 'Eier', phone: '', address: '', insurance: '' }]}));
    const removeStakeholder = (index) => setForm(p => ({ ...p, stakeholders: p.stakeholders.filter((_, i) => i !== index) }));
    const handlePersonnelChange = (type, e) => setForm(p => ({ ...p, [type]: { ...p[type], [e.target.name]: e.target.value }}));
    
    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordInput === 'Larvik123') {
            setIsAdminMode(true); setIsPasswordPromptOpen(false);
            setPasswordError(''); setPasswordInput('');
        } else {
            setPasswordError('Feil passord.'); setPasswordInput('');
        }
    };
    const saveAdminEmail = async () => {
        if (!tempAdminEmail) { showModal("Valideringsfeil", "E-post kan ikke være tom."); return; }
        try {
            await setDoc(doc(db, "rvrSettings", "config"), { recipientEmail: tempAdminEmail });
            setRecipientEmail(tempAdminEmail); setIsAdminMode(false);
            showModal("Suksess", "Mottaker-e-post er oppdatert!");
        } catch (error) { 
            setLastError(error);
            showModal("Feil", `Kunne ikke lagre e-post. Feil: ${error.message}`); 
        }
    };

    const openArchive = async () => {
        setIsArchiveLoading(true); setIsArchiveOpen(true);
        try {
            const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const reports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setArchivedReports(reports);
        } catch (error) { 
            setLastError(error);
            showModal("Arkivfeil", "Kunne ikke hente rapporter."); 
        } 
        finally { setIsArchiveLoading(false); }
    };
    
    const handleLogout = async () => { await signOut(auth); };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const imageFiles = files.map(file => ({
            file: file,
            preview: URL.createObjectURL(file)
        }));
        setForm(prev => ({ ...prev, images: [...prev.images, ...imageFiles]}));
        e.target.value = null;
    };

    const handleRemoveImage = (index) => {
        setForm(prev => {
            const newImages = [...prev.images];
            URL.revokeObjectURL(newImages[index].preview);
            newImages.splice(index, 1);
            return { ...prev, images: newImages };
        });
    };

    const handleSave = async () => {
        if (!form.locationAddress || !form.responseLeader) {
            showModal("Ufullstendig rapport", "Fyll ut 'Skadestedets adresse' og 'Utrykningsleder'.");
            return;
        }
        
        setIsSubmitting(true);
        setLastError(null);
        setSubmissionStatus("Lagrer rapportdata...");
        let docRef;

        try {
            const { images, ...dataToSave } = form; 
            
            docRef = await addDoc(collection(db, "reports"), {
                ...dataToSave,
                images: [],
                submittedBy: user.email,
                createdAt: serverTimestamp()
            });
            
            if (form.images.length > 0) {
                setSubmissionStatus(`Laster opp ${form.images.length} bilde(r)...`);
                
                const uploadPromises = form.images.map((image) => {
                    const imageRef = ref(storage, `reports/${docRef.id}/${image.file.name}`);
                    return new Promise((resolve, reject) => {
                        const uploadTask = uploadBytesResumable(imageRef, image.file);
                        uploadTask.on('state_changed', null, reject, () => {
                            getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject);
                        });
                    });
                });
                
                const imageUrls = await Promise.all(uploadPromises);
                await updateDoc(docRef, { images: imageUrls });
            }
            
            showModal("Suksess!", "Rapporten er lagret i arkivet.", () => resetForm(false));

        } catch (error) {
            console.error("Feil under lagringsprosessen:", error);
            setLastError(error);
            showModal("Feil ved lagring", `Noe gikk galt. Feil: ${error.message}.`);
        } finally {
            setIsSubmitting(false);
            setSubmissionStatus('');
        }
    };
    
    const handleDeleteReport = (reportId, images) => {
        const performDelete = async () => {
            console.log(`Sletter rapport ${reportId}`);
            try {
                // Delete images from Storage
                if (images && images.length > 0) {
                    const deletePromises = images.map(imageUrl => {
                        const imageRef = ref(storage, imageUrl);
                        return deleteObject(imageRef);
                    });
                    await Promise.allSettled(deletePromises);
                    console.log("Bilder slettet fra Storage.");
                }

                // Delete document from Firestore
                await deleteDoc(doc(db, "reports", reportId));
                console.log("Rapport slettet fra Firestore.");

                // Update UI
                setArchivedReports(prev => prev.filter(r => r.id !== reportId));
                showModal("Suksess", "Rapporten ble slettet.");

            } catch (err) {
                console.error("Feil ved sletting:", err);
                setLastError(err);
                showModal("Slettefeil", `Kunne ikke slette rapporten. Feil: ${err.message}`);
            }
        };

        showModal(
            "Slette rapport?", 
            "Er du sikker på at du vil slette? Rapporten og alle tilhørende bilder blir slettet for godt.",
            performDelete
        );
    };


    const resetForm = (confirm = true) => {
        const doReset = () => {
            form.images.forEach(image => URL.revokeObjectURL(image.preview));
            setForm(initialFormState);
        };
        if (confirm) showModal("Nullstille skjema?", "Alle data, inkludert valgte bilder, vil bli slettet.", doReset);
        else doReset();
    };
    
    if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-red-600" /></div>;
    
    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            {modal.isOpen && (<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm text-center">{modal.onConfirm ? <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" /> : <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />}<h2 className="text-xl font-bold text-gray-800 mb-2">{modal.title}</h2><p className="text-gray-600 mb-6">{modal.message}</p><div className={`flex ${modal.onConfirm ? 'justify-between' : 'justify-center'}`}>{modal.onConfirm && <button onClick={closeModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-md">Avbryt</button>}<button onClick={handleConfirm} className="bg-red-600 text-white font-bold py-2 px-6 rounded-md">{modal.onConfirm ? 'Bekreft' : 'OK'}</button></div></div></div>)}
            {isPasswordPromptOpen && (<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"><form onSubmit={handlePasswordSubmit} className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Admin-pålogging</h2><button type="button" onClick={() => setIsPasswordPromptOpen(false)}><X size={24} /></button></div><p className="text-sm text-gray-600 mb-4">Skriv inn passord.</p><div><label htmlFor="password">Passord</label><input type="password" id="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className={`w-full p-2 border ${passwordError ? 'border-red-500' : 'border-gray-300'} rounded-md`} autoFocus/>{passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}</div><button type="submit" className="w-full mt-4 bg-red-600 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center"><KeyRound size={18} className="mr-2" /> Logg inn</button></form></div>)}
            {isAdminMode && (<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Admin-innstillinger</h2><button onClick={() => setIsAdminMode(false)}><X size={24} /></button></div><div><label htmlFor="adminEmail">Mottakerens e-post</label><input type="email" id="adminEmail" value={tempAdminEmail} onChange={(e) => setTempAdminEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"/></div><button onClick={saveAdminEmail} className="w-full mt-4 bg-red-600 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center"><Save size={18} className="mr-2" /> Lagre</button></div></div>)}
            {isArchiveOpen && (<div className="fixed inset-0 bg-white z-40 p-4 sm:p-6 lg:p-8"><div className="max-w-4xl mx-auto h-full flex flex-col"><div className="flex justify-between items-center mb-4 pb-4 border-b"><h2 className="text-2xl font-bold text-red-800">Rapportarkiv</h2><button onClick={() => { setIsArchiveOpen(false); setSelectedReport(null); }} className="p-2 text-gray-600 hover:text-red-700"><X size={28} /></button></div>{isArchiveLoading ? (<div className="flex-grow flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-red-600" /></div>) : selectedReport ? (<ReportDetailView report={selectedReport} onBack={() => setSelectedReport(null)} recipientEmail={recipientEmail} />) : (<ArchiveListView reports={archivedReports} onSelectReport={setSelectedReport} onDeleteReport={handleDeleteReport} />)}</div></div>)}
            {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} error={lastError} />}
            
            <header className="bg-red-700 text-white shadow-md sticky top-0 z-20">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl md:text-2xl font-bold">RVR Rapport</h1>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsInfoOpen(true)} className="p-2 rounded-full hover:bg-red-600 transition-colors" title="Feilsøking"><Info size={24} /></button>
                        <button onClick={openArchive} className="p-2 rounded-full hover:bg-red-600 transition-colors" title="Arkiv"><Archive size={24} /></button>
                        <button onClick={() => setIsPasswordPromptOpen(true)} className="p-2 rounded-full hover:bg-red-600 transition-colors" title="Admin-innstillinger"><UserCog size={24} /></button>
                        <button onClick={handleLogout} className="p-2 rounded-full hover:bg-red-600 transition-colors" title="Logg ut"><LogOut size={24} /></button>
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto p-4 pb-24">
                <form onSubmit={(e) => e.preventDefault()}>
                     <div className="bg-white p-6 rounded-lg shadow mb-6">
                        <h2 className="text-lg font-bold border-b pb-2 mb-4 text-red-800">Generell Informasjon</h2>
                        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                            <FormField label="Dato" name="reportDate" value={form.reportDate} onChange={handleInputChange} type="date" required />
                            <FormField label="Tidspunkt for start" name="startTime" value={form.startTime} onChange={handleInputChange} type="time" required />
                            <FormField label="Skadestedets adresse" name="locationAddress" value={form.locationAddress} onChange={handleInputChange} required />
                            <FormField label="Kommune" name="municipality" value={form.municipality} onChange={handleInputChange} required />
                            <div className="md:col-span-2"><FormField label="Utrykningsleder / RVR-ansvarlig" name="responseLeader" value={form.responseLeader} onChange={handleInputChange} required /></div>
                        </div>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow mb-6">
                        <div className="flex justify-between items-center border-b pb-2 mb-4"><h2 className="text-lg font-bold text-red-800">Forsikringstaker</h2><button type="button" onClick={addStakeholder} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"><Plus size={20} /></button></div>
                        {form.stakeholders.map((s, index) => (
                             <div key={index} className="relative border p-4 rounded-md mb-4 bg-gray-50"><h3 className="font-semibold mb-2">Person {index + 1}</h3>{form.stakeholders.length > 1 && <button type="button" onClick={() => removeStakeholder(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"><Trash2 size={18} /></button>}<div className="grid md:grid-cols-2 gap-x-6 gap-y-4"><FormField label="Navn" name="name" value={s.name} onChange={(e) => handleStakeholderChange(index, e)} /><div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select name="type" value={s.type} onChange={(e) => handleStakeholderChange(index, e)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option>Eier</option><option>Leier</option></select></div><FormField label="Telefon" name="phone" value={s.phone} onChange={(e) => handleStakeholderChange(index, e)} /><FormField label="Adresse" name="address" value={s.address} onChange={(e) => handleStakeholderChange(index, e)} /><div className="md:col-span-2"><FormField label="Forsikringsselskap" name="insurance" value={s.insurance} onChange={(e) => handleStakeholderChange(index, e)} /></div></div></div>
                         ))}
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow mb-6 space-y-6">
                         <h2 className="text-lg font-bold border-b pb-2 text-red-800">Oppdrag og Arbeid</h2>
                         <CheckboxGroup legend="Hvilken sektor gjelder det?" name="sector" options={['Privat (hus og hytte)', 'Borettslag, sameie, blokk', 'Næringsbygg, kjøpesenter, restaurant, driftsbygning', 'Offentlig - kommune, fylke, stat, forsvar']} value={form.sector} onChange={handleCheckboxChange} />
                         <CheckboxGroup legend="Hvilken type bygg er det?" name="buildingType" options={['Enebolig', 'Leilighet, borettslag, sameie, blokk', 'Hytte', 'Landbruksbygg', 'Industri', 'Næringsvirksomhet', 'Hotell, overnattingssted', 'Skole, barnehage, idrettshall', 'Annet']} value={form.buildingType} onChange={handleCheckboxChange} />
                         <CheckboxGroup legend="Oppgi skadetype" name="damageType" options={['Brannskade', 'Vannskade', 'Annet']} value={form.damageType} onChange={handleCheckboxChange} />
                         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4 border-t">
                             <FormField label="Etasjer i bygget" name="buildingFloors" value={form.buildingFloors} onChange={handleInputChange} type="number"/>
                             <FormField label="Skadede etasjer" name="damagedFloors" value={form.damagedFloors} onChange={handleInputChange} type="number"/>
                             <FormField label="Antatt grunnflate (m²)" name="baseArea" value={form.baseArea} onChange={handleInputChange} type="number"/>
                             <FormField label="Antatt skadet areal (m²)" name="damagedArea" value={form.damagedArea} onChange={handleInputChange} type="number"/>
                             <FormField label="Skadede rom" name="damagedRooms" value={form.damagedRooms} onChange={handleInputChange} type="number"/>
                         </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow mb-6 space-y-6">
                        <h2 className="text-lg font-bold border-b pb-2 text-red-800">Arbeidsdetaljer</h2>
                        <CheckboxGroup legend="Hva slags RVR-arbeid ble utført?" name="workPerformed" options={['Pulversuging', 'Røykventilering', 'Lensing av vann', 'Avfukting/tørking', 'Innbo eller utstyr kjørt bort', 'Inventar eller utstyr tildekket med plast', 'Deler av bygningen tildekket med plast', 'Brukt flomvernmateriell', 'Utført sanering-/konservering', 'Utført måling av klorider', 'Strømlevering', 'Inventar eller utstyr flyttet til «sikkert>> sted']} value={form.workPerformed} onChange={handleCheckboxChange} />
                        <div><label htmlFor="valuesSaved" className="block text-sm font-medium text-gray-700 mb-1">Hvilke verdier ble reddet?</label><textarea id="valuesSaved" name="valuesSaved" value={form.valuesSaved} onChange={handleInputChange} rows="3" className="w-full p-2 border border-gray-300 rounded-md"></textarea></div>
                        <CheckboxGroup legend="Benyttet utstyr?" name="equipmentUsed" options={['Plast', 'Avfukter', 'Lensepumpe', 'Røykvifte', 'Sprinklerstopper', 'Strømaggregat', 'Annet']} value={form.equipmentUsed} onChange={handleCheckboxChange} />
                        <div><label htmlFor="damageDescription" className="block text-sm font-medium text-gray-700 mb-1">Beskriv skadeobjekt og forløp</label><textarea id="damageDescription" name="damageDescription" value={form.damageDescription} onChange={handleInputChange} rows="5" className="w-full p-2 border border-gray-300 rounded-md"></textarea></div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow mb-6">
                        <h2 className="text-lg font-bold border-b pb-2 mb-4 text-red-800">Bilder</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {form.images.map((image, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <img src={image.preview} alt={`Forhåndsvisning ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                    <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 group-hover:opacity-100 opacity-0 transition-opacity">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                             <label htmlFor="imageUpload" className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-red-600 cursor-pointer">
                                <Upload size={32} />
                                <span className="text-sm mt-2 text-center">Last opp</span>
                                <input id="imageUpload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                            </label>
                            <label htmlFor="cameraUpload" className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-red-600 cursor-pointer">
                                <Camera size={32} />
                                <span className="text-sm mt-2 text-center">Ta bilde</span>
                                <input id="cameraUpload" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
                            </label>
                        </div>
                    </div>


                    <div className="bg-white p-6 rounded-lg shadow mb-6">
                        <h2 className="text-lg font-bold border-b pb-2 mb-4 text-red-800">RVR-Personell</h2>
                        <div className="mb-4 p-4 border rounded-md bg-gray-50"><h3 className="font-semibold mb-2">På vakt</h3><div className="grid md:grid-cols-3 gap-4"><FormField label="Stasjon" name="station" value={form.personnelOnDuty.station} onChange={(e) => handlePersonnelChange('personnelOnDuty', e)} /><FormField label="Ant. mannskap" name="count" type="number" value={form.personnelOnDuty.count} onChange={(e) => handlePersonnelChange('personnelOnDuty', e)} /><FormField label="Ant. timer" name="hours" type="number" value={form.personnelOnDuty.hours} onChange={(e) => handlePersonnelChange('personnelOnDuty', e)} /></div></div>
                        <div className="p-4 border rounded-md bg-gray-50"><h3 className="font-semibold mb-2">Innkalt</h3><div className="grid md:grid-cols-3 gap-4"><FormField label="Stasjon" name="station" value={form.personnelCalledIn.station} onChange={(e) => handlePersonnelChange('personnelCalledIn', e)} /><FormField label="Ant. mannskap" name="count" type="number" value={form.personnelCalledIn.count} onChange={(e) => handlePersonnelChange('personnelCalledIn', e)} /><FormField label="Ant. timer" name="hours" type="number" value={form.personnelCalledIn.hours} onChange={(e) => handlePersonnelChange('personnelCalledIn', e)} /></div></div>
                    </div>
                 </form>
            </main>
            
            <footer className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-90 p-4 border-t z-10">
                <div className="container mx-auto flex flex-col md:flex-row gap-4">
                     <button type="button" onClick={handleSave} disabled={isSubmitting} className="w-full md:w-2/3 bg-green-600 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center disabled:bg-gray-400">
                        {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> {submissionStatus || 'Lagrer...'}</> : <><Save size={22} className="mr-2" /> Lagre Rapport</>}
                    </button>
                     <button type="button" onClick={() => resetForm(true)} disabled={isSubmitting} className="w-full md:w-1/3 bg-gray-500 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center disabled:bg-gray-400">
                        <X size={22} className="mr-2" /> Nullstill
                    </button>
                </div>
            </footer>
        </div>
    );
}

// --- Helper components for Archive & PDF ---
function ReportDetailView({ report, onBack, recipientEmail }) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState('');

    const downloadPdf = async () => {
        setIsDownloading(true);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const margin = 10;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        let y = 15;
        
        const checkPageBreak = (spaceNeeded = 20) => {
            if (y + spaceNeeded > pageHeight - margin) {
                pdf.addPage();
                y = 15;
            }
        };

        const drawSection = (title, contentDrawer) => {
            checkPageBreak(20); 
            const startY = y;
            pdf.setFontSize(10);
            const titleWidth = pdf.getStringUnitWidth(title) * pdf.getFontSize() / pdf.internal.scaleFactor;
            
            y += 8;
            contentDrawer(margin + 3, y);
            const endY = y;

            pdf.setDrawColor(180, 180, 180);
            pdf.rect(margin, startY, pageWidth - margin * 2, endY - startY + 5);

            pdf.setFillColor(255, 255, 255);
            pdf.rect(margin + 8, startY - 3, titleWidth + 4, 6, 'F');
            pdf.setFont("helvetica", "bold").setFontSize(12).text(title, margin + 10, startY + 1.5);
            y = endY + 10;
        };

        const addImagesToPdf = async () => {
            if (!report.images || report.images.length === 0) return;
            
            pdf.addPage();
            y = 15;
            pdf.setFont("helvetica", "bold").setFontSize(14).text("Vedlegg: Bilder", margin, y);
            y += 15;

            setDownloadStatus(`Laster ned ${report.images.length} bilde(r)...`);

            for (let i = 0; i < report.images.length; i++) {
                const imageUrl = report.images[i];
                try {
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const dataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                    
                    const imgProps = pdf.getImageProperties(dataUrl);
                    const imgWidth = pageWidth - margin * 2;
                    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                    
                    checkPageBreak(imgHeight + 10);
                    
                    pdf.addImage(dataUrl, imgProps.fileType, margin, y, imgWidth, imgHeight);
                    y += imgHeight + 10;

                } catch (error) {
                    console.error("Kunne ikke legge til bilde i PDF:", error);
                    checkPageBreak(10);
                    pdf.setFont("helvetica", "italic").setTextColor(255, 0, 0);
                    pdf.text(`Bilde kunne ikke lastes: ${imageUrl.substring(0, 50)}...`, margin, y);
                    pdf.setTextColor(0, 0, 0);
                    y += 10;
                }
            }
        };

        setDownloadStatus('Bygger rapport...');
        pdf.setFont("helvetica", "bold").setFontSize(24).text("RVR-RAPPORT", pageWidth / 2, y, { align: 'center' });
        y += 8;
        pdf.setFont("helvetica", "normal").setFontSize(12).text("Restverdiredning", pageWidth / 2, y, { align: 'center' });
        y += 15;
        
        drawSection("Generell Informasjon", (x, startY) => {
            let currentY = startY;
            pdf.setFont("helvetica", "normal").setFontSize(10);
            pdf.text(`Dato: ${report.reportDate || ''}`, x, currentY);
            pdf.text(`Tidspunkt: ${report.startTime || ''}`, x + (pageWidth / 2.5), currentY);
            currentY += 7;
            pdf.text(`Adresse: ${report.locationAddress || ''}`, x, currentY);
            pdf.text(`Kommune: ${report.municipality || ''}`, x + (pageWidth / 2.5), currentY);
            currentY += 7;
            pdf.text(`Utrykningsleder/RVR-ansvarlig: ${report.responseLeader || ''}`, x, currentY);
            y = currentY;
        });

        drawSection("Forsikringstaker(e)", (x, startY) => {
            let currentY = startY;
             pdf.setFont("helvetica", "normal").setFontSize(10);
            (report.stakeholders || []).forEach((s, i) => {
                if (i > 0) currentY += 5;
                pdf.setFont("helvetica", "bold").text(`Person ${i + 1}: ${s.name || ''} (${s.type || ''})`, x, currentY);
                currentY += 7;
                pdf.setFont("helvetica", "normal");
                pdf.text(`Tlf: ${s.phone || ''}`, x, currentY);
                pdf.text(`Forsikring: ${s.insurance || ''}`, x + (pageWidth / 2.5), currentY);
                currentY += 7;
                pdf.text(`Adresse: ${s.address || ''}`, x, currentY);
                currentY += 7;
            });
            y = currentY - 7;
        });

        drawSection("Oppdrag og Arbeid", (x, startY) => {
            let currentY = startY;
            const item = (label, value) => {
                pdf.setFont("helvetica", "bold").text(label, x, currentY);
                pdf.setFont("helvetica", "normal").text(String(value || '-'), x + 65, currentY);
                currentY += 7;
            }
            item("Sektor:", (report.sector || []).join(', '));
            item("Byggtype:", (report.buildingType || []).join(', '));
            item("Skadetype:", (report.damageType || []).join(', '));
            currentY += 3;
            item("Etasjer i bygget:", report.buildingFloors);
            item("Skadede etasjer:", report.damagedFloors);
            item("Antatt grunnflate (m²):", report.baseArea);
            item("Antatt skadet areal (m²):", report.damagedArea);
            item("Antall skadede rom:", report.damagedRooms);
            y = currentY - 7;
        });
        
        drawSection("Arbeidsdetaljer", (x, startY) => {
            let currentY = startY;
            pdf.setFont("helvetica", "bold").text("Utført RVR-arbeid:", x, currentY);
            currentY += 6;
            pdf.setFont("helvetica", "normal").text((report.workPerformed || []).join(', ') || '-', x, currentY, { maxWidth: pageWidth - margin * 2 - 10 });
            currentY += 14;

            pdf.setFont("helvetica", "bold").text("Benyttet utstyr:", x, currentY);
            currentY += 6;
            pdf.setFont("helvetica", "normal").text((report.equipmentUsed || []).join(', ') || '-', x, currentY, { maxWidth: pageWidth - margin * 2 - 10 });
            currentY += 14;

            pdf.setFont("helvetica", "bold").text("Reddede verdier:", x, currentY);
            currentY += 6;
            pdf.setFont("helvetica", "normal").text(report.valuesSaved || '-', x, currentY, { maxWidth: pageWidth - margin * 2 - 10 });
            currentY += 14;

            pdf.setFont("helvetica", "bold").text("Beskrivelse av skade og forløp:", x, currentY);
            currentY += 6;
            pdf.setFont("helvetica", "normal").text(report.damageDescription || '-', x, currentY, { maxWidth: pageWidth - margin * 2 - 10 });

            y = currentY + pdf.splitTextToSize(report.damageDescription || '-', pageWidth - margin * 2 - 10).length * 4;
        });

        drawSection("RVR-Personell", (x, startY) => {
            let currentY = startY;
            pdf.setFont("helvetica", "bold").text("Personell på vakt:", x, currentY);
            pdf.setFont("helvetica", "normal").text(`Stasjon: ${report.personnelOnDuty?.station || '-'}, Antall: ${report.personnelOnDuty?.count || '-'}, Timer: ${report.personnelOnDuty?.hours || '-'}`, x + 50, currentY);
            currentY += 10;
            pdf.setFont("helvetica", "bold").text("Innkalt personell:", x, currentY);
            pdf.setFont("helvetica", "normal").text(`Stasjon: ${report.personnelCalledIn?.station || '-'}, Antall: ${report.personnelCalledIn?.count || '-'}, Timer: ${report.personnelCalledIn?.hours || '-'}`, x + 50, currentY);
            y = currentY;
        });

        await addImagesToPdf();

        setDownloadStatus('Lagrer PDF...');
        pdf.save(`RVR-Rapport-${report.locationAddress.replace(/ /g, '_') || 'rapport'}.pdf`);
        setIsDownloading(false);
        setDownloadStatus('');
    };

    const handleEmail = () => {
        const subject = `RVR Rapport fra Larvik brann og redning. Adresse: ${report.locationAddress}`;
        const body = `Hei,\n\nVedlagt ligger RVR-rapport fra hendelse på adressen ${report.locationAddress}.\n\nVennligst se vedlegg for alle detaljer.\n\n\nMvh\nLarvik brann og redning`;
        window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const DetailSection = ({ title, children }) => (<div className="mb-6"><h3 className="text-lg font-bold text-red-800 border-b pb-2 mb-3">{title}</h3>{children}</div>);
    const DetailItem = ({ label, value }) => (<p className="mb-1"><strong className="font-semibold text-gray-700">{label}:</strong> {Array.isArray(value) && value.length > 0 ? value.join(', ') : (!Array.isArray(value) && value ? value : 'Ikke spesifisert')}</p>);

    return (
        <div className="overflow-y-auto flex-grow">
            <div className='flex justify-between items-center mb-4 flex-wrap gap-2'>
                <button onClick={onBack} className="flex items-center gap-2 text-red-600 font-semibold hover:underline">
                    <ArrowLeft size={20} /> Tilbake til arkivlisten
                </button>
                <div className='flex gap-2'>
                    <button onClick={handleEmail} className="flex items-center gap-2 bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700">
                        <Mail size={20} className="mr-2" /> Send E-post
                    </button>
                    <button onClick={downloadPdf} disabled={isDownloading} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                        {isDownloading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <FileDown size={20} className="mr-2" />}
                        {isDownloading ? downloadStatus : 'Lagre som PDF'}
                    </button>
                </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg border">
                 <DetailSection title="Generell Informasjon">
                    <DetailItem label="Dato" value={report.reportDate} />
                    <DetailItem label="Tidspunkt" value={report.startTime} />
                    <DetailItem label="Adresse" value={report.locationAddress} />
                    <DetailItem label="Kommune" value={report.municipality} />
                    <DetailItem label="Utrykningsleder" value={report.responseLeader} />
                    <DetailItem label="Rapport innsendt av" value={report.submittedBy} />
                </DetailSection>

                <DetailSection title="Forsikringstaker(e)">
                    {report.stakeholders && report.stakeholders.map((s, i) => (
                        <div key={i} className="mb-3 p-3 bg-gray-50 rounded-md border">
                            <DetailItem label={`Person ${i+1}`} value={`${s.name} (${s.type})`} />
                            <DetailItem label="Telefon" value={s.phone} />
                            <DetailItem label="Adresse" value={s.address} />
                            <DetailItem label="Forsikringsselskap" value={s.insurance} />
                        </div>
                    ))}
                </DetailSection>

                {report.images && report.images.length > 0 && (
                    <DetailSection title="Bilder">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {report.images.map((url, index) => (
                                <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                    <img src={url} alt={`Bilde ${index + 1}`} className="w-full h-40 object-cover rounded-md border hover:opacity-80 transition-opacity" />
                                </a>
                            ))}
                        </div>
                    </DetailSection>
                )}
            </div>
        </div>
    );
}

function ArchiveListView({ reports, onSelectReport, onDeleteReport }) {
    if (reports.length === 0) return <div className="text-center text-gray-500 py-10">Ingen rapporter funnet i arkivet.</div>;
    return (
        <div className="space-y-3 overflow-y-auto">
            {reports.map(report => (
                <div key={report.id} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-lg shadow-sm transition-all">
                    <button onClick={() => onSelectReport(report)} className="flex-grow text-left">
                        <p className="font-bold text-gray-800">{report.locationAddress}</p>
                        <p className="text-sm text-gray-600">{report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleString('nb-NO') : 'Dato mangler'}</p>
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteReport(report.id, report.images);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Slett rapport"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            ))}
        </div>
    );
}

function InfoModal({ onClose, error }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Feilsøkingsinformasjon</h2>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto text-gray-700">
                    <h3 className="font-bold">Siste registrerte feil</h3>
                    {error ? (
                        <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-md font-mono text-sm break-words">
                            <p><strong>Kode:</strong> {error.code || 'Ingen kode'}</p>
                            <p><strong>Melding:</strong> {error.message || 'Ingen melding'}</p>
                        </div>
                    ) : (
                        <p>Ingen feil har blitt registrert i denne økten.</p>
                    )}
                     <h3 className="font-bold pt-4 border-t">Systeminformasjon</h3>
                     <div className="p-3 bg-gray-50 border rounded-md font-mono text-sm break-words">
                        <p><strong>Prosjekt-ID:</strong> {firebaseConfig.projectId}</p>
                        <p><strong>Storage Bucket:</strong> {firebaseConfig.storageBucket}</p>
                        <p><strong>Auth Domain:</strong> {firebaseConfig.authDomain}</p>
                        <p><strong>Nettleser:</strong> {navigator.userAgent}</p>
                     </div>
                    <p className="pt-4 border-t">
                        Hvis problemet vedvarer, ta et skjermbilde av denne informasjonen og feilmeldingen i nettleserens konsoll (trykk F12 for å åpne) og send det til systemansvarlig.
                    </p>
                </div>
                 <div className="p-4 bg-gray-50 border-t"><button onClick={onClose} className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700">Lukk</button></div>
            </div>
        </div>
    );
}
