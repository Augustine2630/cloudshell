import './App.css'
import { useState } from 'react'
import HostListComponent from './component/HostListComponent'
import TerminalComponent from './component/TerminalComponent'

function App() {
    const [selectedHostIp, setSelectedHostIp] = useState<string | null>(null)

    return (
        <>
            {selectedHostIp ? (
                <TerminalComponent ip={selectedHostIp} />
            ) : (
                <HostListComponent onSelectHost={(ip: string) => setSelectedHostIp(ip)} />
            )}
        </>
    )
}

export default App
