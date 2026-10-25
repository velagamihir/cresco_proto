export interface DevicePreset {
    id: string;
    name: string;
    category: 'Desktop' | 'Tablet' | 'Mobile';
    width: number;
    height: number;
}

export const DEVICE_PRESETS: DevicePreset[] = [
    // Desktop
    { id: 'desktop-1440', name: 'Desktop', category: 'Desktop', width: 1440, height: 1024 },
    { id: 'macbook-air', name: 'MacBook Air', category: 'Desktop', width: 1280, height: 832 },
    { id: 'macbook-pro-16', name: 'MacBook Pro 16"', category: 'Desktop', width: 1728, height: 1117 },
    { id: 'wireframe-desktop', name: 'Wireframe Desktop', category: 'Desktop', width: 1200, height: 800 },

    // Tablet
    { id: 'ipad-pro-11', name: 'iPad Pro 11"', category: 'Tablet', width: 834, height: 1194 },
    { id: 'ipad-air', name: 'iPad Air', category: 'Tablet', width: 820, height: 1180 },
    { id: 'ipad-mini', name: 'iPad Mini', category: 'Tablet', width: 744, height: 1133 },

    // Mobile
    { id: 'iphone-16-pro', name: 'iPhone 16 Pro', category: 'Mobile', width: 393, height: 852 },
    { id: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max', category: 'Mobile', width: 440, height: 956 },
    { id: 'iphone-se', name: 'iPhone SE', category: 'Mobile', width: 375, height: 667 },
    { id: 'android-compact', name: 'Android Compact', category: 'Mobile', width: 360, height: 800 },
    { id: 'android-large', name: 'Android Large', category: 'Mobile', width: 412, height: 915 },
];
