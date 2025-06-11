import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { UserCog, X, Plus, Save, Loader2, ShieldCheck, AlertTriangle, KeyRound, Archive, ArrowLeft, Info, LogOut, Shield, Mail, FileDown, Trash2 } from 'lucide-react';
import { jsPDF } from "jspdf";

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

    const handleSave = async () => {
        if (!form.locationAddress || !form.responseLeader) {
            showModal("Ufullstendig rapport", "Fyll ut 'Skadestedets adresse' og 'Utrykningsleder'.");
            return;
        }
        setIsSubmitting(true);
        try {
            const finalReportData = { 
                ...form, 
                createdAt: serverTimestamp(), 
                submittedBy: user.email,
            };
            await addDoc(collection(db, "reports"), finalReportData);
            
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
                        <CheckboxGroup legend="Hva slags RVR-arbeid ble utført?" name="workPerformed" options={['Pulversuging', 'Røykventilering', 'Lensing av vann', 'Avfukting/tørking', 'Innbo eller utstyr kjørt bort', 'Inventar eller utstyr tildekket med plast', 'Deler av bygningen tildekket med plast', 'Brukt flomvernmateriell', 'Utført sanering-/konservering', 'Utført måling av klorider', 'Strømlevering', 'Inventar eller utstyr flyttet til «sikkert>> sted']} value={form.workPerformed} onChange={handleCheckboxChange} />
                        <div><label htmlFor="valuesSaved" className="block text-sm font-medium text-gray-700 mb-1">Hvilke verdier ble reddet?</label><textarea id="valuesSaved" name="valuesSaved" value={form.valuesSaved} onChange={handleInputChange} rows="3" className="w-full p-2 border border-gray-300 rounded-md"></textarea></div>
                        <CheckboxGroup legend="Benyttet utstyr?" name="equipmentUsed" options={['Plast', 'Avfukter', 'Lensepumpe', 'Røykvifte', 'Sprinklerstopper', 'Strømaggregat', 'Annet']} value={form.equipmentUsed} onChange={handleCheckboxChange} />
                        <div><label htmlFor="damageDescription" className="block text-sm font-medium text-gray-700 mb-1">Beskriv skadeobjekt og forløp</label><textarea id="damageDescription" name="damageDescription" value={form.damageDescription} onChange={handleInputChange} rows="5" className="w-full p-2 border border-gray-300 rounded-md"></textarea></div>
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
function ReportDetailView({ report, onBack, recipientEmail }) {
    const [isDownloading, setIsDownloading] = useState(false);

    const downloadPdf = async () => {
        setIsDownloading(true);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const margin = 10;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        let y = 15;
        const lineHeight = 6;
        const fieldGap = 8;
        
        // --- PDF HELPER FUNCTIONS ---
        const checkPageBreak = (spaceNeeded = 20) => {
            if (y + spaceNeeded > pageHeight - margin) {
                pdf.addPage();
                y = 15;
            }
        };

        const drawHeader = () => {
             pdf.setFont("helvetica", "bold").setFontSize(24).text("RVR", margin, y);
             pdf.setFont("helvetica", "normal").setFontSize(10).text("Restverdiredning", margin, y + 5);
             pdf.setFont("helvetica", "bold").setFontSize(24).text("RVR-RAPPORT", pageWidth - margin, y, { align: 'right' });
             pdf.setFont("helvetica", "normal").setFontSize(10).text("Restverdiredning", pageWidth - margin, y + 5, { align: 'right' });
             y += 20;
        };

        const drawCheckbox = (x, yPos, text, isChecked) => {
            pdf.setDrawColor(0);
            pdf.rect(x, yPos - 3.5, 4, 4); // Draw the box
            if (isChecked) {
                pdf.setFontSize(10).text('X', x + 0.8, yPos);
            }
            pdf.setFont("helvetica", "normal").setFontSize(10).text(text, x + 6, yPos);
        };
        
        const drawTextBox = (label, content, customHeight) => {
             checkPageBreak(customHeight || 30);
             pdf.setFont("helvetica", "bold").setFontSize(10).text(label, margin, y);
             y += 5;
             const textLines = pdf.splitTextToSize(content || 'Ikke spesifisert', pageWidth - margin * 2 - 4);
             const boxHeight = customHeight || (textLines.length * (lineHeight-1)) + 6;
             checkPageBreak(boxHeight + 5);
             pdf.setDrawColor(180, 180, 180);
             pdf.rect(margin, y, pageWidth - margin * 2, boxHeight);
             pdf.setFont("helvetica", "normal").setFontSize(10).text(textLines, margin + 2, y + 5);
             y += boxHeight + fieldGap;
        };


        // --- START PDF GENERATION ---
        
        drawHeader();

        // --- GENERAL INFO ---
        pdf.setFont("helvetica", "normal").setFontSize(10);
        pdf.text(`Dato: ${report.reportDate || ''}`, margin, y);
        pdf.text(`Skadestedets adresse: ${report.locationAddress || ''}`, margin, y + fieldGap);
        pdf.text(`Tidspunkt for start RVR-oppdrag: ${report.startTime || ''}`, pageWidth / 2, y);
        pdf.text(`Kommune: ${report.municipality || ''}`, pageWidth / 2, y + fieldGap);
        y += fieldGap * 2;
        pdf.text(`Utrykningsleder / RVR-ansvarlig på stedet: ${report.responseLeader || ''}`, margin, y);
        y += fieldGap + 2;

        // --- STAKEHOLDERS ---
        pdf.setFont("helvetica", "bold").setFontSize(12).text("Forsikringstaker og- selskap", margin, y);
        y += lineHeight;
        (report.stakeholders || []).forEach((s, i) => {
            checkPageBreak(35);
            pdf.setFont("helvetica", "bold").setFontSize(10).text(`${i + 1}. Navn: `, margin, y);
            pdf.setFont("helvetica", "normal").text(s.name || '', margin + 15, y);
            drawCheckbox(margin + 90, y, 'Eier', s.type === 'Eier');
            drawCheckbox(margin + 110, y, 'Leier', s.type === 'Leier');
            y += fieldGap;
            pdf.setFont("helvetica", "bold").text('TLF: ', margin, y);
            pdf.setFont("helvetica", "normal").text(s.phone || '', margin + 15, y);
            y += fieldGap;
            pdf.setFont("helvetica", "bold").text('Adresse: ', margin, y);
            pdf.setFont("helvetica", "normal").text(s.address || '', margin + 18, y);
            y += fieldGap;
            pdf.setFont("helvetica", "bold").text('Forsikringsselskap: ', margin, y);
            pdf.setFont("helvetica", "normal").text(s.insurance || '', margin + 40, y);
            y += fieldGap + 2;
        });

        // --- OPPDRAG OG ARBEID ---
        checkPageBreak(10);
        pdf.line(margin, y, pageWidth - margin, y); // separator
        y += fieldGap;
        
        pdf.setFont("helvetica", "bold").setFontSize(12).text("Oppdrag og arbeid", margin, y);
        y += lineHeight;

        const createCheckboxColumn = (title, options, selected, x, startY, colWidth) => {
            let yPos = startY;
            pdf.setFont("helvetica", "bold").setFontSize(10).text(title, x, yPos);
            yPos += lineHeight;
            options.forEach(opt => {
                checkPageBreak(8);
                drawCheckbox(x, yPos, opt, selected.includes(opt));
                yPos += lineHeight;
            });
            return yPos;
        };

        const sectorOptions = ['Privat (hus og hytte)', 'Borettslag, sameie, blokk', 'Næringsbygg, kjøpesenter, restaurant, driftsbygning', 'Offentlig - kommune, fylke, stat, forsvar'];
        const buildingTypeOptions = ['Enebolig', 'Leilighet, borettslag, sameie, blokk', 'Hytte', 'Landbruksbygg', 'Industri', 'Næringsvirksomhet', 'Hotell, overnattingssted', 'Skole, barnehage, idrettshall', 'Annet'];
        
        let yCol1 = createCheckboxColumn("Hvilken sektor gjelder det?", sectorOptions, report.sector || [], margin, y, 80);
        let yCol2 = createCheckboxColumn("Hvilken type bygg er det?", buildingTypeOptions, report.buildingType || [], margin + 95, y, 80);
        y = Math.max(yCol1, yCol2) + fieldGap;

        checkPageBreak(25);
        pdf.setFont("helvetica", "bold").setFontSize(10).text("Oppgi skadetype:", margin, y);
        drawCheckbox(margin + 40, y, "Brannskade", (report.damageType || []).includes("Brannskade"));
        drawCheckbox(margin + 75, y, "Vannskade", (report.damageType || []).includes("Vannskade"));
        drawCheckbox(margin + 110, y, "Annet", (report.damageType || []).includes("Annet"));
        y += fieldGap;
        
        // --- DAMAGE DETAILS ---
        const detailFields1 = [
            { label: 'Hvor mange etasjer har bygget?', value: report.buildingFloors },
            { label: 'Hvor stor er antatt grunnflate i m2?', value: report.baseArea },
            { label: 'Hvor mange rom er skadet?', value: report.damagedRooms },
        ];
        const detailFields2 = [
            { label: 'Hvor mange etasjer er skadet?', value: report.damagedFloors },
            { label: 'Hvor mange kvadratmeter er antatt skadet?', value: report.damagedArea },
        ];
        
        detailFields1.forEach(f => {
            checkPageBreak(8);
            pdf.setFont("helvetica", "bold").text(f.label, margin, y);
            pdf.setFont("helvetica", "normal").text(String(f.value || ''), margin + 70, y);
            y += lineHeight;
        });
         detailFields2.forEach(f => {
            checkPageBreak(8);
            pdf.setFont("helvetica", "bold").text(f.label, margin + 95, y - (lineHeight * detailFields1.length));
            pdf.setFont("helvetica", "normal").text(String(f.value || ''), margin + 175, y - (lineHeight * detailFields1.length));
            y += lineHeight;
        });
        y -= lineHeight * (detailFields1.length -1);


        // --- WORK PERFORMED ---
        checkPageBreak(60);
        const workPerformedOptions = [
            'Pulversuging', 'Røykventilering', 'Lensing av vann', 'Avfukting/tørking', 'Innbo eller utstyr kjørt bort', 
            'Inventar eller utstyr tildekket med plast', 'Deler av bygningen tildekket med plast', 'Brukt flomvernmateriell', 
            'Utført sanering-/konservering', 'Utført måling av klorider', 'Strømlevering', 'Inventar eller utstyr flyttet til «sikkert>> sted'
        ];
        createCheckboxColumn("Hva slags RVR-arbeid ble utført?", workPerformedOptions, report.workPerformed || [], margin, y, pageWidth - margin*2);
        y += workPerformedOptions.length * lineHeight + fieldGap;

        // --- PAGE 2 CONTENT ---
        checkPageBreak(pageHeight); // Force new page if not enough space
        
        drawTextBox("Hvilke verdier ble reddet? (Skal fylles ut)", report.valuesSaved || '', 40);
        
        const equipmentOptions = ['Plast', 'Avfukter', 'Lensepumpe', 'Røykvifte', 'Sprinklerstopper', 'Strømaggregat', 'Annet'];
        let yEquip = createCheckboxColumn("Ble det benyttet noe utstyr?", equipmentOptions, report.equipmentUsed || [], margin, y, 80);
        y = yEquip + fieldGap;
        
        drawTextBox("Beskriv skadeobjektet ved ankomst og arbeidets forløp. (Skal fylles ut)", report.damageDescription || '', 60);

        // --- RVR PERSONNEL TABLE ---
        checkPageBreak(40);
        pdf.setFont("helvetica", "bold").setFontSize(12).text("RVR-personell", margin, y);
        y += lineHeight;
        const tableCol = [margin, margin + 50, margin + 110, margin + 140];
        const tableHeader = ["Vaktmannskap", "Brannvesen / brannstasjon", "Ant. mannskap", "Ant. timer"];
        pdf.setDrawColor(0);
        pdf.setFillColor(230, 230, 230);
        pdf.rect(margin, y, pageWidth - margin*2, 8, 'F');
        pdf.setFont("helvetica", "bold").setFontSize(10);
        pdf.text(tableHeader[0], tableCol[0] + 2, y + 5.5);
        pdf.text(tableHeader[1], tableCol[1] + 2, y + 5.5);
        pdf.text(tableHeader[2], tableCol[2] + 2, y + 5.5);
        pdf.text(tableHeader[3], tableCol[3] + 2, y + 5.5);
        y += 8;

        const drawTableRow = (rowData) => {
            checkPageBreak(8);
            pdf.rect(margin, y, pageWidth - margin*2, 8);
            pdf.setFont("helvetica", "normal").setFontSize(10);
            pdf.text(String(rowData[0] || ''), tableCol[0] + 2, y + 5.5);
            pdf.text(String(rowData[1] || ''), tableCol[1] + 2, y + 5.5);
            pdf.text(String(rowData[2] || ''), tableCol[2] + 2, y + 5.5);
            pdf.text(String(rowData[3] || ''), tableCol[3] + 2, y + 5.5);
            y += 8;
        };

        drawTableRow([
            "På vakt", 
            report.personnelOnDuty?.station, 
            report.personnelOnDuty?.count, 
            report.personnelOnDuty?.hours
        ]);
        drawTableRow([
            "Innkalt", 
            report.personnelCalledIn?.station, 
            report.personnelCalledIn?.count, 
            report.personnelCalledIn?.hours
        ]);
        
        // --- SAVE PDF ---
        pdf.save(`RVR-Rapport-${report.locationAddress.replace(/ /g, '_') || 'rapport'}.pdf`);
        setIsDownloading(false);
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
                        {isDownloading ? 'Genererer...' : 'Lagre som PDF'}
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
            </div>
        </div>
    );
}

function ArchiveListView({ reports, onSelectReport }) {
    if (reports.length === 0) return <div className="text-center text-gray-500 py-10">Ingen rapporter funnet i arkivet.</div>;
    return <div className="space-y-3 overflow-y-auto">{reports.map(report => (<button key={report.id} onClick={() => onSelectReport(report)} className="w-full text-left p-4 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-lg shadow-sm transition-all"><p className="font-bold text-gray-800">{report.locationAddress}</p><p className="text-sm text-gray-600">{report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleString('nb-NO') : 'Dato mangler'}</p></button>))}</div>;
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
                        <InfoListItem>Når lokalt brannvesen er ute på brann eller mindre vannlekkasje og gjør stedet «tørt og røykfritt», kan det skrives RVR-rapport på dette. </InfoListItem>
                        <InfoListItem>F.eks. en kjøkkenbrann. Dere slukker brannen og setter på røykvifte for å gjøre det røykfritt. Da kan det skrives RVR-rapport på 1 eller 2 mannskap i f.eks. en halvtime eller time.  <strong>Husk!</strong> Godtgjøring gjelder de som utfører RVR og ikke brannbekjempelse. </InfoListItem>
                        <InfoListItem>Lokalt brannvesen kan iverksette og håndtere hele RVR-oppdraget alene, med det utstyret og de mannskapene dere har tilgjengelig. </InfoListItem>
                        <InfoListItem>RVR-bil kan rykke ut med mer kompetanse og mer utstyr om oppdraget tilsier det.  Dette avklares med vertskommune. </InfoListItem>
                        <InfoListItem>Lokalt brannvesen må i slike tilfeller også foreta rapportskriving og billedtaking.</InfoListItem>
                        <InfoListItem>All info må sendes til vaktleder hos vertskommunene for RVR i tilhørende region, som kvalitetssjekker og videresender. </InfoListItem>
                        <InfoListItem>Vær ærlig på personer og timer. Det blir normalt ikke godkjent 4-6 mannskaper på et mindre RVR-oppdrag (f.eks. mindre vannsuging/røykvifte vil være 1-2 mann). </InfoListItem>
                        <InfoListItem>Ved større hendelser (større vannlekkasjer eller omfattende branner) vil det kunne være behov for flere mannskaper, men ved slike oppdrag bør uansett RVR-bil fra vertskommune rykke ut. </InfoListItem>
                        <InfoListItem>Man må skille mellom det kommunale ansvaret (brannslokking, etterslokk, vakthold) og RVR-innsatsen (røykventilering, tildekking, utbæring av innbo etc.). </InfoListItem>
                         <InfoListItem>Er det i tvil, kontakt vaktleder hos vertskommunen til RVR i den regionen dere tilhører. </InfoListItem>
                    </ul>
                    <h3 className="font-bold pt-4 border-t">En forutsetning er at oppdrag skal avklares med vaktleder hos vertskommunen før RVR-arbeidet starter: </h3>
                     <ul className="space-y-3">
                        <InfoListItem>Her avtales det om man gjør det selv eller om vertskommunen for RVR bør rykke ut med RVR-bil og ekstra utstyr. </InfoListItem>
                        <InfoListItem>Man skal ikke utføre arbeid og deretter sende over rapport uten at dette er avklart. </InfoListItem>
                    </ul>
                    <p className="pt-4 border-t">Rapport fra lokalt brannvesen til vertskommune bør normalt sendes i løpet av 12-24 timer etter hendelsen. </p>
                    <p className="font-bold">Husk! RVR-oppdrag over 4 timer skal godkjennes av forsikringsselskap. </p>
                </div>
                 <div className="p-4 bg-gray-50 border-t"><button onClick={onClose} className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700">Lukk</button></div>
            </div>
        </div>
    );
}
