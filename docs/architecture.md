# System Architecture

## High-Level Design

The Contest-Reminder-WhatsApp-Bot follows a simple, efficient architecture with three main components: the Bot Server, external data sources, and WhatsApp as the delivery platform.

```mermaid
graph TB
    subgraph External["External Services"]
        API["Clist.by API<br/><br/>Contest Data<br/><br/>• CodeChef<br/>• Codeforces<br/>• LeetCode<br/>• AtCoder"]
    end
    
    subgraph Server["Bot Server - Node.js"]
        SCHED["Scheduler Module<br/><br/>• Daily at 5:00 AM<br/>• Every 30 minutes"]
        PROC["Data Processor<br/><br/>• Parse JSON<br/>• Filter Contests<br/>• Format Messages<br/>• Set Reminders"]
        WA["WhatsApp Client<br/><br/>• Baileys Library<br/>• Session Manager<br/>• Message Sender"]
    end
    
    subgraph Delivery["Message Delivery"]
        WAP["WhatsApp Platform<br/><br/>Target Recipients:<br/>• User Groups<br/>• Individual Users"]
    end
    
    API -->|"HTTP GET<br/>Fetch Contest Data"| PROC
    SCHED -->|Trigger| PROC
    PROC --> WA
    WA -->|"WhatsApp Protocol<br/>Send Formatted Messages"| WAP
    
    classDef externalClass fill:#1565c0,stroke:#0d47a1,stroke-width:3px,color:#ffffff
    classDef schedulerClass fill:#ef6c00,stroke:#e65100,stroke-width:3px,color:#ffffff
    classDef processorClass fill:#c62828,stroke:#b71c1c,stroke-width:3px,color:#ffffff
    classDef whatsappClass fill:#00695c,stroke:#004d40,stroke-width:3px,color:#ffffff
    
    class API externalClass
    class SCHED schedulerClass
    class PROC processorClass
    class WA whatsappClass
```

## Data Flow

### 1. Contest Notification Flow

```mermaid
flowchart TD
    A["Trigger<br/><br/>Daily at 5:00 AM IST"] --> B["Fetch Data from Clist.by API<br/><br/>GET /api/v4/contest/"]
    B -->|"JSON Response<br/>contests: ..."| C["Process Response<br/><br/>• Parse JSON<br/>• Filter by platform<br/>• Filter by date<br/>• Convert timezone"]
    C -->|"Structured Data"| D["Format Message<br/><br/>• Create text format<br/>• Add contest details<br/>• Include links<br/>• Set reminders"]
    D -->|"WhatsApp Message"| E["Send to WhatsApp<br/><br/>• Connect to groups<br/>• Send formatted msg<br/>• Log delivery"]
    
    classDef triggerClass fill:#ef6c00,stroke:#e65100,stroke-width:3px,color:#ffffff
    classDef fetchClass fill:#1565c0,stroke:#0d47a1,stroke-width:3px,color:#ffffff
    classDef processClass fill:#c62828,stroke:#b71c1c,stroke-width:3px,color:#ffffff
    classDef formatClass fill:#6a1b9a,stroke:#4a148c,stroke-width:3px,color:#ffffff
    classDef sendClass fill:#2e7d32,stroke:#1b5e20,stroke-width:3px,color:#ffffff
    
    class A triggerClass
    class B fetchClass
    class C processClass
    class D formatClass
    class E sendClass
```

### 2. Reminder Flow

```mermaid
flowchart TD
    A["Trigger<br/><br/>Every 30 minutes"] --> B["Check Reminder File<br/><br/>Load pending reminders"]
    B --> C{"Match Current Time<br/><br/>Is it time to remind?"}
    C -->|YES| D["Send Reminder<br/><br/>• Format reminder msg<br/>• Send to WhatsApp<br/>• Remove from file"]
    C -->|NO| E["Wait for next check"]
    
    classDef triggerClass fill:#ef6c00,stroke:#e65100,stroke-width:3px,color:#ffffff
    classDef checkClass fill:#1565c0,stroke:#0d47a1,stroke-width:3px,color:#ffffff
    classDef decisionClass fill:#c62828,stroke:#b71c1c,stroke-width:3px,color:#ffffff
    classDef actionClass fill:#2e7d32,stroke:#1b5e20,stroke-width:3px,color:#ffffff
    classDef waitClass fill:#ad1457,stroke:#880e4f,stroke-width:3px,color:#ffffff
    
    class A triggerClass
    class B checkClass
    class C decisionClass
    class D actionClass
    class E waitClass
```

## Component Details

### 1. Scheduler Module

Manages all automated tasks and timing:

- **Daily Contest Notifications**: Runs at 5:00 AM IST
- **Reminder Checks**: Every 30 minutes

### 2. Data Processor

Handles all contest data operations:

- Fetches data from Clist.by API
- Filters contests by platform (CodeChef, Codeforces, LeetCode, AtCoder)
- Filters contests by date (today and tomorrow)
- Converts timezones (UTC to IST)
- Formats messages for WhatsApp
- Creates and stores reminders

### 3. WhatsApp Client

Manages all WhatsApp communication:

- Uses Baileys library for WhatsApp Web API
- Handles QR code authentication
- Maintains persistent sessions
- Sends messages to groups and individuals
- Auto-reconnection logic

### 4. WhatsApp Integration Layer

#### Connection Management

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open: QR Code Scan
    Open --> Closed: Connection Lost
    Closed --> Open: Auto-reconnect
    Open --> [*]: Logout
```

**Disconnect Handling**:
- `loggedOut`: Requires re-authentication
- `connectionClosed`: Auto-reconnect
- `connectionLost`: Auto-reconnect
- `connectionReplaced`: Manual restart required
- `restartRequired`: Auto-restart
- `timedOut`: Auto-reconnect

#### Authentication
- Uses Baileys multi-file auth state
- Stores credentials in `auth_info_baileys/`
- QR code generated on first run
- Persistent session across restarts

### 5. Storage Layer

#### File-Based Storage

**auth_info_baileys/**
- Session credentials
- Pre-keys for encryption
- Device information
- App state sync data

**reminderFile.txt**
```json
{
  "time": "2024-01-15T10:30:00.000Z",
  "message": "Contest reminder message"
}
```

#### In-Memory Storage (NodeCache)

```javascript
groupCache = {
  stdTTL: 300,  // 5 minutes
  useClones: false
}
```
- Caches group metadata
- Reduces API calls
- Improves performance

