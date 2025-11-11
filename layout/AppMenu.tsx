/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);

    const model: AppMenuItem[] = [
        {
            label: 'Coaching',
            items: [
                { label: 'Dashboard', icon: 'pi pi-home', to: '/dashboard' },
                { label: 'Start Session', icon: 'pi pi-play-circle', to: '/coach' },
                { label: 'Session History', icon: 'pi pi-clock', to: '/history' },
            ],
        },
        {
            label: 'Resources',
            items: [
                { label: 'Curriculum', icon: 'pi pi-book', to: '/curriculum' },
                { label: 'Students', icon: 'pi pi-users', to: '/students' },
            ],
        },
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
