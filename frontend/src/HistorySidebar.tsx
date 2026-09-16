import React, { useState } from 'react';
import { History, X as CloseIcon, Plus, MessageSquare, Search } from 'lucide-react';

const HISTORY_DATA = [
  {
    group: 'Today',
    items: ['Weather forecast for Shimla', 'Best time to visit Goa', 'Storm alerts near me'],
  },
  {
    group: 'Yesterday',
    items: ['Climate trends for 2026', 'Will it rain tomorrow?', 'Cyclone tracker update'],
  },
  {
    group: 'Previous 7 days',
    items: [
      'Travel weather for Mumbai trip',
      'UV index this week',
      'Snowfall prediction',
      'Air quality index today',
      'Best hiking weather this weekend',
    ],
  },
];

export default function HistorySidebar({ open, setOpen }: { open: boolean, setOpen: (v: boolean | ((prev: boolean) => boolean)) => void }) {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  return (
    <>
      <style>{`
        @keyframes historyItemIn {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .history-scroll::-webkit-scrollbar { width: 6px; }
        .history-scroll::-webkit-scrollbar-thumb { background: #E9E3FF; border-radius: 999px; }
        .history-scroll::-webkit-scrollbar-track { background: transparent; }
        @keyframes historyPop {
          0%   { transform: translateY(-50%) scale(1); }
          35%  { transform: translateY(-50%) scale(0.86); }
          65%  { transform: translateY(-50%) scale(1.1); }
          100% { transform: translateY(-50%) scale(1); }
        }
      `}</style>

      {/* Left-center navbar-style toggle */}
      <NavbarHistoryButton open={open} onToggle={() => setOpen((o) => !o)} />

      {/* Click-away scrim */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 30,
          background: 'rgba(30, 20, 60, 0.04)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: open ? '280px' : '0px',
          overflow: 'hidden',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid var(--border-color)',
          boxShadow: open ? '6px 0 28px rgba(124, 58, 237, 0.10)' : 'none',
          zIndex: 40,
          transition: 'width 0.38s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.38s ease',
        }}
      >
        <div
          style={{
            width: '280px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '22px 14px 16px',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingLeft: '6px',
              paddingRight: '2px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)',
                }}
              />
              <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--fg)', letterSpacing: '-0.01em' }}>
                History
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted-fg)',
                padding: '6px',
                borderRadius: '7px',
                display: 'flex',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-hover)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-fg)'; }}
            >
              <CloseIcon size={17} />
            </button>
          </div>

          {/* New chat */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--primary)',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Plus size={16} /> New chat
          </button>

          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 10px',
              borderRadius: '9px',
              background: 'var(--glass-hover)',
              marginBottom: '18px',
              color: 'var(--muted-fg)',
            }}
          >
            <Search size={14} />
            <span style={{ fontSize: '13px' }}>Search history</span>
          </div>

          {/* List */}
          <div className="history-scroll" style={{ flex: 1, overflowY: 'auto', marginRight: '-6px', paddingRight: '6px' }}>
            {HISTORY_DATA.map((group, gi) => (
              <div key={group.group} style={{ marginBottom: '18px' }}>
                <div
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    marginBottom: '8px',
                    paddingLeft: '7px',
                  }}
                >
                  {group.group}
                </div>
                {group.items.map((item, ii) => {
                  const key = `${gi}-${ii}`;
                  const isActive = activeItem === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setActiveItem(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '9px 8px',
                        borderRadius: '9px',
                        fontSize: '13.5px',
                        color: isActive ? 'var(--primary)' : 'var(--fg)',
                        background: isActive ? 'var(--glass-hover)' : 'transparent',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        animation: open ? `historyItemIn 0.32s ease ${(gi * 3 + ii) * 0.035}s backwards` : 'none',
                        transition: 'background 0.15s ease, color 0.15s ease',
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--glass-hover)'; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.55 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function NavbarHistoryButton({ open, onToggle }: { open: boolean, onToggle: () => void }) {
  const [popping, setPopping] = useState(false);

  const handleClick = () => {
    setPopping(true);
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      onAnimationEnd={() => setPopping(false)}
      aria-label={open ? 'Close history' : 'Open history'}
      style={{
        position: 'fixed',
        top: '50%',
        left: open ? '296px' : '20px',
        zIndex: 50,
        width: '54px',
        height: '54px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '18px',
        border: '1px solid var(--border-color)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(24px)',
        boxShadow: open
          ? '0 12px 32px rgba(124, 58, 237, 0.18), 0 2px 6px rgba(124, 58, 237, 0.08)'
          : '0 10px 28px rgba(124, 58, 237, 0.12), 0 2px 6px rgba(124, 58, 237, 0.05)',
        color: open ? 'var(--primary)' : 'var(--fg)',
        cursor: 'pointer',
        animation: popping ? 'historyPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        transform: 'translateY(-50%)',
        transition:
          'left 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s ease, border-color 0.25s ease, box-shadow 0.3s ease, color 0.25s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          '0 14px 36px rgba(124, 58, 237, 0.22), 0 2px 6px rgba(124, 58, 237, 0.1)';
        e.currentTarget.style.background = 'var(--glass-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--glass-bg)';
        e.currentTarget.style.boxShadow = open
          ? '0 12px 32px rgba(124, 58, 237, 0.18), 0 2px 6px rgba(124, 58, 237, 0.08)'
          : '0 10px 28px rgba(124, 58, 237, 0.12), 0 2px 6px rgba(124, 58, 237, 0.05)';
      }}
    >
      <span
        style={{
          position: 'relative',
          width: '20px',
          height: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <History
          size={20}
          strokeWidth={2}
          style={{
            position: 'absolute',
            opacity: open ? 0 : 1,
            transform: open ? 'rotate(-90deg) scale(0.6)' : 'rotate(0deg) scale(1)',
            transition: 'opacity 0.22s ease, transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <CloseIcon
          size={20}
          strokeWidth={2}
          style={{
            position: 'absolute',
            opacity: open ? 1 : 0,
            transform: open ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.6)',
            transition: 'opacity 0.22s ease, transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </span>
    </button>
  );
}
