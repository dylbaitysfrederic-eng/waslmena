'use client';

import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useLocale } from 'next-intl';

import { ActiveLink } from '@/components/ActiveLink';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ToggleMenuButton } from '@/components/ToggleMenuButton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/templates/Logo';
import { getI18nPath } from '@/utils/Helpers';

export const DashboardHeader = (props: {
  menu: {
    href: string;
    label: string;
  }[];
  secondaryMenu: {
    group?: string;
    href: string;
    label: string;
  }[];
  settingsLabel: string;
}) => {
  const locale = useLocale();

  return (
    <>
      <div className="flex items-center">
        <Link href="/dashboard" className="max-sm:hidden">
          <Logo />
        </Link>

        <svg
          className="size-8 stroke-muted-foreground max-sm:hidden"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" />
          <path d="M17 5 7 19" />
        </svg>

        <OrganizationSwitcher
          organizationProfileMode="navigation"
          organizationProfileUrl={getI18nPath(
            '/dashboard/organization-profile',
            locale,
          )}
          afterCreateOrganizationUrl="/dashboard"
          hidePersonal
          skipInvitationScreen
          appearance={{
            elements: {
              organizationSwitcherTrigger: 'max-w-28 sm:max-w-52',
            },
          }}
        />

        <nav className="ms-3 max-lg:hidden">
          <ul className="flex flex-row items-center gap-x-2 text-sm font-medium xl:gap-x-3 xl:text-base [&_a:hover]:opacity-100 [&_a]:opacity-75">
            {props.menu.map(item => (
              <li key={item.href}>
                <ActiveLink href={getI18nPath(item.href, locale)}>
                  {item.label}
                </ActiveLink>
              </li>
            ))}
            <li>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="px-3 py-2 text-sm font-medium xl:text-base">
                    {props.settingsLabel}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                  {props.secondaryMenu.map((item, index) => (
                    <div key={item.href}>
                      {item.group
                      && item.group !== props.secondaryMenu[index - 1]?.group && (
                        <>
                          {index > 0 && <DropdownMenuSeparator />}
                          <DropdownMenuLabel>{item.group}</DropdownMenuLabel>
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={getI18nPath(item.href, locale)}>
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          </ul>
        </nav>
      </div>

      <div>
        <ul className="flex items-center gap-x-1.5 [&_li[data-fade]:hover]:opacity-100 [&_li[data-fade]]:opacity-60">
          <li data-fade>
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <ToggleMenuButton />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-64">
                  <DropdownMenuLabel>{props.settingsLabel}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {props.menu.map(item => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={getI18nPath(item.href, locale)}>
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  {props.secondaryMenu.map((item, index) => (
                    <div key={item.href}>
                      {item.group
                      && item.group !== props.secondaryMenu[index - 1]?.group && (
                        <>
                          {index > 0 && <DropdownMenuSeparator />}
                          <DropdownMenuLabel>{item.group}</DropdownMenuLabel>
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={getI18nPath(item.href, locale)}>
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>

          {/* PRO: Dark mode toggle button */}

          <li data-fade>
            <LocaleSwitcher />
          </li>

          <li>
            <Separator orientation="vertical" className="h-4" />
          </li>

          <li>
            <UserButton
              userProfileMode="navigation"
              userProfileUrl="/dashboard/user-profile"
              appearance={{
                elements: {
                  rootBox: 'px-2 py-1.5',
                },
              }}
            />
          </li>
        </ul>
      </div>
    </>
  );
};
