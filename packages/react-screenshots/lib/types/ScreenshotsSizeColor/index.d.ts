import React from 'react';
import './index.less';
export interface SizeColorProps {
    size: number;
    color: string;
    onSizeChange: (value: number) => void;
    onColorChange: (value: string) => void;
}
declare const _default: React.NamedExoticComponent<SizeColorProps>;
export default _default;
