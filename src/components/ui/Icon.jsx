import React from 'react';
import { Icons } from './Icons';

const Icon = ({ icon, size = 20, className = "" }) => {
    const Component = Icons[icon];
    if (!Component) return null;
    return <Component width={size} height={size} className={className} />;
};

export default Icon;
