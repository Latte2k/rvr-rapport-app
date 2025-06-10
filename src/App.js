import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { Camera, FileImage, Trash2, UserCog, X, Plus, Save, Loader2, ShieldCheck, AlertTriangle, KeyRound, Archive, ArrowLeft, Info, LogOut, Shield, FileDown, Mail } from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDkUF1zg9-UdgxUYk89EtYGvrq2EFN_sZQ",
  authDomain: "rvr-rapport.firebaseapp.com",
  projectId: "rvr-rapport",
  storageBucket: "rvr-rapport.appspot.com",
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
        equipmentUsed: []
    };
    
    const [form, setForm] = useState(initialFormState);
    const [images, setImages] = useState([]);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
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
                showModal("Feil", "Kunne ikke laste innstillinger. Sjekk sikkerhetsregler i Firebase.");
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
    const handleImageUpload = (e) => {
        const newImages = Array.from(e.target.files).map(file => ({ file, preview: URL.createObjectURL(file) }));
        setImages(p => [...p, ...newImages]);
    };
    const removeImage = (index) => {
        URL.revokeObjectURL(images[index].preview);
        setImages(p => p.filter((_, i) => i !== index));
    };
    
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
        } catch (error) { showModal("Feil", `Kunne ikke lagre e-post. Feil: ${error.message}`); }
    };

    const openArchive = async () => {
        setIsArchiveLoading(true); setIsArchiveOpen(true);
        try {
            const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const reports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setArchivedReports(reports);
        } catch (error) { showModal("Arkivfeil", "Kunne ikke hente rapporter."); } 
        finally { setIsArchiveLoading(false); }
    };
    
    const handleLogout = async () => { await signOut(auth); };
    const uploadImages = async (reportId) => {
        if (images.length === 0) return [];
        const imageUrls = await Promise.all(
            images.map(async (image) => {
                const imageRef = ref(storage, `reports/${reportId}/${image.file.name}`);
                await uploadBytes(imageRef, image.file);
                return getDownloadURL(imageRef);
            })
        );
        return imageUrls;
    };

    const handleSave = async () => {
        if (!form.locationAddress || !form.responseLeader) {
            showModal("Ufullstendig rapport", "Fyll ut 'Skadestedets adresse' og 'Utrykningsleder'.");
            return;
        }
        setIsSubmitting(true);
        try {
            const newReportRef = doc(collection(db, "reports"));
            const reportId = newReportRef.id;

            const imageUrls = await uploadImages(reportId);
            
            const finalReportData = { 
                ...form, 
                id: reportId,
                createdAt: serverTimestamp(), 
                submittedBy: user.email,
                imageUrls: imageUrls
            };
            await setDoc(newReportRef, finalReportData);
            
            showModal("Suksess!", "Rapporten er lagret i arkivet.", () => resetForm(false));

        } catch (error) {
            console.error("Submit Error: ", error);
            showModal("Feil ved lagring", `Noe gikk galt. Rapporten ble ikke lagret. Feil: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = (confirm = true) => {
        const doReset = () => {
            setForm(initialFormState);
            images.forEach(img => URL.revokeObjectURL(img.preview));
            setImages([]);
        };
        if (confirm) showModal("Nullstille skjema?", "Alle data vil bli slettet.", doReset);
        else doReset();
    };
    
    if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-red-600" /></div>;
    
    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            {/* --- All Modals --- */}
            {modal.isOpen && (<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm text-center">{modal.onConfirm ? <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" /> : <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />}<h2 className="text-xl font-bold text-gray-800 mb-2">{modal.title}</h2><p className="text-gray-600 mb-6">{modal.message}</p><div className={`flex ${modal.onConfirm ? 'justify-between' : 'justify-center'}`}>{modal.onConfirm && <button onClick={closeModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-md">Avbryt</button>}<button onClick={handleConfirm} className="bg-red-600 text-white font-bold py-2 px-6 rounded-md">{modal.onConfirm ? 'Bekreft' : 'OK'}</button></div></div></div>)}
            {isPasswordPromptOpen && (<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"><form onSubmit={handlePasswordSubmit} className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Admin-pålogging</h2><button type="button" onClick={() => setIsPasswordPromptOpen(false)}><X size={24} /></button></div><p className="text-sm text-gray-600 mb-4">Skriv inn passord.</p><div><label htmlFor="password">Passord</label><input type="password" id="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className={`w-full p-2 border ${passwordError ? 'border-red-500' : 'border-gray-300'} rounded-md`} autoFocus/>{passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}</div><button type="submit" className="w-full mt-4 bg-red-600 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center"><KeyRound size={18} className="mr-2" /> Logg inn</button></form></div>)}
            {isAdminMode && (<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Admin-innstillinger</h2><button onClick={() => setIsAdminMode(false)}><X size={24} /></button></div><div><label htmlFor="adminEmail">Mottakerens e-post</label><input type="email" id="adminEmail" value={tempAdminEmail} onChange={(e) => setTempAdminEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"/></div><button onClick={saveAdminEmail} className="w-full mt-4 bg-red-600 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center"><Save size={18} className="mr-2" /> Lagre</button></div></div>)}
            {isArchiveOpen && (<div className="fixed inset-0 bg-white z-40 p-4 sm:p-6 lg:p-8"><div className="max-w-4xl mx-auto h-full flex flex-col"><div className="flex justify-between items-center mb-4 pb-4 border-b"><h2 className="text-2xl font-bold text-red-800">Rapportarkiv</h2><button onClick={() => { setIsArchiveOpen(false); setSelectedReport(null); }} className="p-2 text-gray-600 hover:text-red-700"><X size={28} /></button></div>{isArchiveLoading ? (<div className="flex-grow flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-red-600" /></div>) : selectedReport ? (<ReportDetailView report={selectedReport} onBack={() => setSelectedReport(null)} recipientEmail={recipientEmail} />) : (<ArchiveListView reports={archivedReports} onSelectReport={setSelectedReport} />)}</div></div>)}
            {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} />}
            
            <header className="bg-red-700 text-white shadow-md sticky top-0 z-20">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl md:text-2xl font-bold">RVR Rapport</h1>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsInfoOpen(true)} className="p-2 rounded-full hover:bg-red-600 transition-colors" title="Informasjon"><Info size={24} /></button>
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
                        <CheckboxGroup legend="Hva slags RVR-arbeid ble utført?" name="workPerformed" options={['Pulversuging', 'Røykventilering', 'Lensing av vann', 'Avfukting/tørking', 'Utkjøring av innbo', 'Tildekking av innbo', 'Tildekking av bygning', 'Brukt flomvernmateriell', 'Sanering/konservering', 'Måling av klorider', 'Strømlevering', 'Flytting til sikkert sted']} value={form.workPerformed} onChange={handleCheckboxChange} />
                        <div><label htmlFor="valuesSaved" className="block text-sm font-medium text-gray-700 mb-1">Hvilke verdier ble reddet?</label><textarea id="valuesSaved" name="valuesSaved" value={form.valuesSaved} onChange={handleInputChange} rows="3" className="w-full p-2 border border-gray-300 rounded-md"></textarea></div>
                        <CheckboxGroup legend="Benyttet utstyr?" name="equipmentUsed" options={['Plast', 'Avfukter', 'Lensepumpe', 'Røykvifte', 'Sprinklerstopper', 'Strømaggregat', 'Annet']} value={form.equipmentUsed} onChange={handleCheckboxChange} />
                        <div><label htmlFor="damageDescription" className="block text-sm font-medium text-gray-700 mb-1">Beskriv skadeobjekt og forløp</label><textarea id="damageDescription" name="damageDescription" value={form.damageDescription} onChange={handleInputChange} rows="5" className="w-full p-2 border border-gray-300 rounded-md"></textarea></div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow mb-6">
                        <h2 className="text-lg font-bold border-b pb-2 mb-4 text-red-800">RVR-Personell</h2>
                        <div className="mb-4 p-4 border rounded-md bg-gray-50"><h3 className="font-semibold mb-2">På vakt</h3><div className="grid md:grid-cols-3 gap-4"><FormField label="Stasjon" name="station" value={form.personnelOnDuty.station} onChange={(e) => handlePersonnelChange('personnelOnDuty', e)} /><FormField label="Ant. mannskap" name="count" type="number" value={form.personnelOnDuty.count} onChange={(e) => handlePersonnelChange('personnelOnDuty', e)} /><FormField label="Ant. timer" name="hours" type="number" value={form.personnelOnDuty.hours} onChange={(e) => handlePersonnelChange('personnelOnDuty', e)} /></div></div>
                        <div className="p-4 border rounded-md bg-gray-50"><h3 className="font-semibold mb-2">Innkalt</h3><div className="grid md:grid-cols-3 gap-4"><FormField label="Stasjon" name="station" value={form.personnelCalledIn.station} onChange={(e) => handlePersonnelChange('personnelCalledIn', e)} /><FormField label="Ant. mannskap" name="count" type="number" value={form.personnelCalledIn.count} onChange={(e) => handlePersonnelChange('personnelCalledIn', e)} /><FormField label="Ant. timer" name="hours" type="number" value={form.personnelCalledIn.hours} onChange={(e) => handlePersonnelChange('personnelCalledIn', e)} /></div></div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow mb-6">
                        <h2 className="text-lg font-bold border-b pb-2 mb-4 text-red-800">Bilder</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="flex flex-col items-center p-6 bg-white text-red-600 rounded-lg shadow-sm tracking-wide uppercase border-2 border-dashed border-gray-300 cursor-pointer hover:border-red-500 hover:text-red-700"><Camera size={32} /><span className="mt-2 text-base">Bruk kamera</span><input type='file' accept="image/*" capture="camera" className="hidden" onChange={handleImageUpload} /></label><label className="flex flex-col items-center p-6 bg-white text-red-600 rounded-lg shadow-sm tracking-wide uppercase border-2 border-dashed border-gray-300 cursor-pointer hover:border-red-500 hover:text-red-700"><FileImage size={32} /><span className="mt-2 text-base">Velg fra galleri</span><input type='file' accept="image/*" multiple className="hidden" onChange={handleImageUpload} /></label></div>
                        {images.length > 0 && <div className="mt-6"><h3 className="font-semibold mb-2">Forhåndsvisning ({images.length} bilder):</h3><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{images.map((image, index) => (<div key={index} className="relative"><img src={image.preview} alt={`preview ${index}`} className="w-full h-32 object-cover rounded-md" /><button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"><Trash2 size={16} /></button></div>))}</div></div>}
                    </div>
                 </form>
            </main>
            
            <footer className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-90 p-4 border-t z-10">
                <div className="container mx-auto flex flex-col md:flex-row gap-4">
                     <button type="button" onClick={handleSave} disabled={isSubmitting} className="w-full md:w-2/3 bg-green-600 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center disabled:bg-gray-400">
                        {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Lagrer... </>: <><Save size={22} className="mr-2" /> Lagre Rapport</>}
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

const downloadReportAsPdf = async (reportData) => {
    if (!window.jspdf) {
        alert("PDF-bibliotek ikke lastet. Prøv å laste siden på nytt.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = 15;
    const margin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const addText = (text, x, yPos, options) => {
        if (!text) return yPos;
        const lines = pdf.splitTextToSize(String(text), pageWidth - margin * 2);
        pdf.text(lines, x, yPos, options);
        return yPos + (lines.length * 5);
    };
    
    const checkPageBreak = (currentY, elementHeight) => {
        if (currentY + elementHeight > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            return margin; // New y position
        }
        return currentY;
    };

    const addSection = (title, contentFn) => {
        y = checkPageBreak(y, 15);
        pdf.setFontSize(14).text(title, margin, y);
        y += 2;
        pdf.setDrawColor(0).line(margin, y, pageWidth - margin, y);
        y += 7;
        pdf.setFontSize(11);
        y = contentFn(y);
        y += 10;
    };

    pdf.setFontSize(18).text("RVR Rapport", margin, y); y += 10;
    pdf.setFontSize(10).text(`Rapportdato: ${new Date().toLocaleDateString('nb-NO')}`, margin, y); y += 10;

    addSection("Generell Informasjon", (y) => {
        y = addText(`Dato: ${reportData.reportDate || ''}`, margin, y);
        y = addText(`Tidspunkt: ${reportData.startTime || ''}`, margin, y);
        y = addText(`Adresse: ${reportData.locationAddress || ''}`, margin, y);
        y = addText(`Kommune: ${reportData.municipality || ''}`, margin, y);
        y = addText(`Utrykningsleder: ${reportData.responseLeader || ''}`, margin, y);
        y = addText(`Innsendt av: ${reportData.submittedBy || ''}`, margin, y);
        return y;
    });

    addSection("Forsikringstaker(e)", (y) => {
        (reportData.stakeholders || []).forEach((s, i) => {
            y = checkPageBreak(y, 25);
            y = addText(`Person ${i+1}: ${s.name || ''} (${s.type || ''})`, margin, y);
            y = addText(`   Tlf: ${s.phone || ''}`, margin, y);
            y = addText(`   Adresse: ${s.address || ''}`, margin, y);
            y = addText(`   Selskap: ${s.insurance || ''}`, margin, y);
            y += 3;
        });
        return y;
    });

    addSection("Oppdrag og omfang", (y) => {
        y = addText(`Sektor: ${reportData.sector?.join(', ') || 'Ikke spesifisert'}`, margin, y);
        y = addText(`Byggtype: ${reportData.buildingType?.join(', ') || 'Ikke spesifisert'}`, margin, y);
        y = addText(`Skadetype: ${reportData.damageType?.join(', ') || 'Ikke spesifisert'}`, margin, y);
        y = addText(`Etasjer i bygget: ${reportData.buildingFloors || 'Ikke spesifisert'}`, margin, y);
        y = addText(`Skadede etasjer: ${reportData.damagedFloors || 'Ikke spesifisert'}`, margin, y);
        y = addText(`Antatt grunnflate (m²): ${reportData.baseArea || 'Ikke spesifisert'}`, margin, y);
        y = addText(`Antatt skadet areal (m²): ${reportData.damagedArea || 'Ikke spesifisert'}`, margin, y);
        y = addText(`Skadede rom: ${reportData.damagedRooms || 'Ikke spesifisert'}`, margin, y);
        return y;
    });
    
    addSection("Beskrivelse av forløp", (y) => addText(reportData.damageDescription, margin, y));
    addSection("Reddede verdier", (y) => addText(reportData.valuesSaved, margin, y));

    addSection("Utført arbeid og utstyr", (y) => {
        y = addText(`Utført RVR-arbeid: ${reportData.workPerformed?.join(', ') || 'Ikke spesifisert'}`, margin, y);
        y = addText(`Benyttet utstyr: ${reportData.equipmentUsed?.join(', ') || 'Ikke spesifisert'}`, margin, y);
        return y;
    });

    addSection("Personell", (y) => {
        y = addText(`På vakt - Stasjon: ${reportData.personnelOnDuty?.station || 'Ikke spesifisert'}, Antall: ${reportData.personnelOnDuty?.count || '0'}, Timer: ${reportData.personnelOnDuty?.hours || '0'}`, margin, y);
        y = addText(`Innkalt - Stasjon: ${reportData.personnelCalledIn?.station || 'Ikke spesifisert'}, Antall: ${reportData.personnelCalledIn?.count || '0'}, Timer: ${reportData.personnelCalledIn?.hours || '0'}`, margin, y);
        return y;
    });
    
    if (reportData.imageUrls && reportData.imageUrls.length > 0) {
        pdf.addPage();
        y = margin;
        pdf.setFontSize(14).text("Bilder", margin, y);
        y += 7;

        for (const url of reportData.imageUrls) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();
                const dataUrl = await new Promise(resolve => {
                    reader.onload = e => resolve(e.target.result);
                    reader.readAsDataURL(blob);
                });
                
                const imgProps = pdf.getImageProperties(dataUrl);
                const imgWidth = pageWidth - margin * 2;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                y = checkPageBreak(y, imgHeight + 5);
                pdf.addImage(dataUrl, 'JPEG', margin, y, imgWidth, imgHeight);
                y += imgHeight + 5;

            } catch (e) { console.error("Could not add image to PDF:", e); }
        }
    }

    pdf.save(`RVR-Rapport-${reportData.locationAddress.replace(/ /g, '_')}.pdf`);
};


function ArchiveListView({ reports, onSelectReport }) {
    if (reports.length === 0) return <div className="text-center text-gray-500 py-10">Ingen rapporter funnet i arkivet.</div>;
    return <div className="space-y-3 overflow-y-auto">{reports.map(report => (<button key={report.id} onClick={() => onSelectReport(report)} className="w-full text-left p-4 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-lg shadow-sm transition-all"><p className="font-bold text-gray-800">{report.locationAddress}</p><p className="text-sm text-gray-600">{report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleString('nb-NO') : 'Dato mangler'}</p></button>))}</div>;
}

function ReportDetailView({ report, onBack, recipientEmail }) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        await downloadReportAsPdf({ ...report, imageUrls: report.imageUrls || [] });
        setIsDownloading(false);
    };

    const handleEmail = () => {
        const subject = `RVR Rapport: ${report.locationAddress}`;
        const body = `Hei,\n\nHer er en RVR rapport.\n\n(For å sende rapporten, last den først ned som PDF og legg den ved i denne e-posten).`;
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
                        <Mail size={20} className="mr-2" /> Send i E-post
                    </button>
                    <button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                        {isDownloading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <FileDown size={20} className="mr-2" />}
                        {isDownloading ? 'Genererer...' : 'Last ned som PDF'}
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

                <DetailSection title="Oppdrag og omfang">
                    <DetailItem label="Sektor" value={report.sector} />
                    <DetailItem label="Byggtype" value={report.buildingType} />
                    <DetailItem label="Skadetype" value={report.damageType} />
                    <DetailItem label="Etasjer i bygget" value={report.buildingFloors}/>
                    <DetailItem label="Skadede etasjer" value={report.damagedFloors}/>
                    <DetailItem label="Antatt grunnflate (m²)" value={report.baseArea}/>
                    <DetailItem label="Antatt skadet areal (m²)" value={report.damagedArea}/>
                    <DetailItem label="Skadede rom" value={report.damagedRooms}/>
                </DetailSection>

                 <DetailSection title="Utført arbeid og verdier">
                    <DetailItem label="Utført RVR-arbeid" value={report.workPerformed} />
                    <DetailItem label="Benyttet utstyr" value={report.equipmentUsed} />
                    <p className="mt-4 font-semibold text-gray-700">Reddede verdier:</p>
                    <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md border">{report.valuesSaved || 'Ikke spesifisert'}</p>
                </DetailSection>
                
                <DetailSection title="Beskrivelse av forløp">
                    <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md border">{report.damageDescription || 'Ikke spesifisert'}</p>
                </DetailSection>
                
                <DetailSection title="Personell">
                    <div className="mb-3 p-3 bg-gray-50 rounded-md border">
                        <p className="font-semibold">På vakt:</p>
                        <DetailItem label="Stasjon" value={report.personnelOnDuty?.station} />
                        <DetailItem label="Antall" value={report.personnelOnDuty?.count} />
                        <DetailItem label="Timer" value={report.personnelOnDuty?.hours} />
                    </div>
                     <div className="p-3 bg-gray-50 rounded-md border">
                        <p className="font-semibold">Innkalt:</p>
                        <DetailItem label="Stasjon" value={report.personnelCalledIn?.station} />
                        <DetailItem label="Antall" value={report.personnelCalledIn?.count} />
                        <DetailItem label="Timer" value={report.personnelCalledIn?.hours} />
                    </div>
                </DetailSection>

                <DetailSection title="Bilder">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {report.imageUrls && report.imageUrls.length > 0 ? report.imageUrls.map((url, i) => (<a key={i} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Bilde ${i+1}`} className="w-full h-auto object-cover rounded-md border shadow-sm" crossOrigin="anonymous"/></a>)) : <p>Ingen bilder.</p>}
                    </div>
                </DetailSection>
            </div>
        </div>
    );
}

function InfoModal({ onClose }) {
    const InfoListItem = ({ children }) => (<li className="flex items-start gap-3"><span className="text-red-500 mt-1">&#10148;</span><span>{children}</span></li>);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-gray-800">Føringer for RVR-arbeid</h2><button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800"><X size={24} /></button></div>
                <div className="p-6 space-y-4 overflow-y-auto text-gray-700">
                    <h3 className="font-bold">Følgende føringer gjelder når «lokalt brannvesen» utfører hele RVR-jobben selv:</h3>
                    <ul className="space-y-3">
                        <InfoListItem>Når lokalt brannvesen er ute på brann eller mindre vannlekkasje og gjør stedet «tørt og røykfritt», kan det skrives RVR-rapport på dette.</InfoListItem>
                        <InfoListItem>F.eks. en kjøkkenbrann. Dere slukker brannen og setter på røykvifte for å gjøre det røykfritt. Da kan det skrives RVR-rapport på 1 eller 2 mannskap i f.eks. en halvtime eller time. <strong>Husk!</strong> Godtgjøring gjelder de som utfører RVR og ikke brannbekjempelse.</InfoListItem>
                        <InfoListItem>Lokalt brannvesen kan iverksette og håndtere hele RVR-oppdraget alene, med det utstyret og de mannskapene dere har tilgjengelig.</InfoListItem>
                        <InfoListItem>RVR-bil kan rykke ut med mer kompetanse og mer utstyr om oppdraget tilsier det. Dette avklares med vertskommune.</InfoListItem>
                        <InfoListItem>Lokalt brannvesen må i slike tilfeller også foreta rapportskriving og billedtaking.</InfoListItem>
                        <InfoListItem>All info må sendes til vaktleder hos vertskommunene for RVR i tilhørende region, som kvalitetssjekker og videresender.</InfoListItem>
                        <InfoListItem>Vær ærlig på personer og timer. Det blir normalt ikke godkjent 4-6 mannskaper på et mindre RVR-oppdrag (f.eks. mindre vannsuging/røykvifte vil være 1-2 mann).</InfoListItem>
                        <InfoListItem>Ved større hendelser (større vannlekkasjer eller omfattende branner) vil det kunne være behov for flere mannskaper, men ved slike oppdrag bør uansett RVR-bil fra vertskommune rykke ut.</InfoListItem>
                        <InfoListItem>Man må skille mellom det kommunale ansvaret (brannslokking, etterslokk, vakthold) og RVR-innsatsen (røykventilering, tildekking, utbæring av innbo etc.).</InfoListItem>
                         <InfoListItem>Er det i tvil, kontakt vaktleder hos vertskommunen til RVR i den regionen dere tilhører.</InfoListItem>
                    </ul>
                    <h3 className="font-bold pt-4 border-t">En forutsetning er at oppdrag skal avklares med vaktleder hos vertskommunen før RVR-arbeidet starter:</h3>
                     <ul className="space-y-3">
                        <InfoListItem>Her avtales det om man gjør det selv eller om vertskommunen for RVR bør rykke ut med RVR-bil og ekstra utstyr.</InfoListItem>
                        <InfoListItem>Man skal ikke utføre arbeid og deretter sende over rapport uten at dette er avklart.</InfoListItem>
                    </ul>
                    <p className="pt-4 border-t">Rapport fra lokalt brannvesen til vertskommune bør normalt sendes i løpet av 12-24 timer etter hendelsen.</p>
                    <p className="font-bold">Husk! RVR-oppdrag over 4 timer skal godkjennes av forsikringsselskap.</p>
                </div>
                 <div className="p-4 bg-gray-50 border-t"><button onClick={onClose} className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700">Lukk</button></div>
            </div>
        </div>
    );
}

