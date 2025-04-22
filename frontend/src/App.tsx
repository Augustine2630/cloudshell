import './App.css'
import { useState } from 'react'
import HostListComponent from './component/HostListComponent'
import TerminalComponent from './component/TerminalComponent'

function App() {
    const [selectedHostIp, setSelectedHostIp] = useState<string | null>(null)
    const [isAuthenticated, setAuthenticated] = useState<boolean>(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = () => {
        // Заменить на реальную проверку авторизации
        if (username === 'admin' && password === '1234') {
            setAuthenticated(true)
        } else {
            alert('Неверный логин или пароль')
        }
    }

    if (!isAuthenticated) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20vh' }}>
                <h2>Авторизация</h2>
                <input
                    type="text"
                    placeholder="Логин"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ marginBottom: '10px' }}
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ marginBottom: '10px' }}
                />
                <button onClick={handleLogin}>Войти</button>
            </div>
        )
    }

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
