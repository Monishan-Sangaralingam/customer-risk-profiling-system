import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    const [menuPath, setMenuOpen] = useState(null);
    const location = useLocation();
    const menuOpen = menuPath === location.key;
    const menuButton = useRef(null);
    const menuDialog = useRef(null);
    useEffect(() => {
        if (!menuOpen) return;
        menuDialog.current?.querySelector('a')?.focus();
        function close(event) {
            if (event.key === 'Escape') { setMenuOpen(null); menuButton.current?.focus(); }
            if (event.key === 'Tab') {
                const controls = [...menuDialog.current.querySelectorAll('a, button')];
                const first = controls[0], last = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        }
        window.addEventListener('keydown', close);
        return () => window.removeEventListener('keydown', close);
    }, [menuOpen]);
    return (
        <div className="flex h-dvh bg-gray-50 overflow-hidden font-sans">
            <div className="hidden lg:block shrink-0"><Sidebar /></div>
            {menuOpen && <div ref={menuDialog} className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Navigation">
                <button aria-label="Close navigation" className="absolute inset-0 bg-black/50" onClick={() => { setMenuOpen(false); menuButton.current?.focus(); }} />
                <div className="relative h-full"><Sidebar onNavigate={() => setMenuOpen(false)} /></div>
            </div>}

            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <Header menuOpen={menuOpen} menuButton={menuButton} onToggleMenu={() => setMenuOpen(menuOpen ? null : location.key)} />

                <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto bg-gray-50 p-3 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
