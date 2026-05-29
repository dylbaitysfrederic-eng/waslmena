'use client';

import { useEffect, useState } from 'react';

export const DeviceInfoField = () => {
  const [deviceInfo, setDeviceInfo] = useState('');

  useEffect(() => {
    const viewport = `${window.innerWidth}x${window.innerHeight}`;
    const language = navigator.language || 'unknown language';
    const platform = navigator.platform || 'unknown platform';

    setDeviceInfo(`${platform}; ${language}; viewport ${viewport}`);
  }, []);

  return <input type="hidden" name="deviceInfo" value={deviceInfo} readOnly />;
};
