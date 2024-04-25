import React from 'react'

import { HorizontalSeparator } from '../../../components/HorizontalSeparator'
import { SummaryIcon } from '../../../components/icons/pages/SummaryIcon'
import { cn } from '../../../utils/cn'
import { DESKTOP_PROJECT_NAVIGATION_IDS } from './ids'
import { ProjectDetailsSection } from './sections/types'
import { UnderReviewCallout } from './UnderReviewCallout'

interface Project {
  title: string
  showProjectUnderReview?: boolean
  icon: string | undefined
}
interface ProjectNavigationProps {
  project: Project
  sections: ProjectDetailsSection[]
}

export function DesktopProjectNavigation({
  project,
  sections,
}: ProjectNavigationProps) {
  const translateClassName = project.showProjectUnderReview
    ? '-translate-y-[202px]'
    : '-translate-y-16'
  return (
    <div
      className="sticky top-8"
      id={DESKTOP_PROJECT_NAVIGATION_IDS.container}
      data-is-under-review={project.showProjectUnderReview ?? false}
    >
      <div
        id={DESKTOP_PROJECT_NAVIGATION_IDS.listHeader}
        className={cn(
          '-z-1 opacity-0 transition-all duration-300',
          translateClassName,
        )}
      >
        <div className="flex flex-row items-center gap-4">
          {project.icon && (
            <img
              className="size-8"
              src={project.icon}
              alt={`${project.title} logo`}
            />
          )}
          <span className="text-xl font-bold lg:text-2xl">{project.title}</span>
        </div>
        {project.showProjectUnderReview && (
          <UnderReviewCallout small className="mt-2" />
        )}
        <HorizontalSeparator className="my-4" />
      </div>
      <div
        className={cn(
          'flex flex-col gap-3 transition-transform duration-300',
          translateClassName,
        )}
        id={DESKTOP_PROJECT_NAVIGATION_IDS.list}
      >
        <a
          href="#"
          className="flex flex-row items-center gap-3 opacity-60 transition-opacity hover:opacity-100"
          id={DESKTOP_PROJECT_NAVIGATION_IDS.summaryItem}
        >
          <SummaryIcon className="size-6" />
          Summary
        </a>
        <ProjectNavigationList sections={sections} />
      </div>
    </div>
  )
}

function ProjectNavigationList({
  sections,
}: Pick<ProjectNavigationProps, 'sections'>) {
  return (
    <>
      {sections.map((section, i) => {
        if (section.excludeFromNavigation) {
          return null
        }
        return (
          <a
            key={section.props.id}
            href={`#${section.props.id}`}
            className="flex flex-row items-center opacity-60 transition-opacity hover:opacity-100"
          >
            <NavigationListIndex index={i + 1} />
            <span className="ml-3">{section.props.title}</span>
          </a>
        )
      })}
    </>
  )
}

function NavigationListIndex(props: { index: number }) {
  return (
    <div
      className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-center text-xs font-bold dark:bg-neutral-700"
      id={DESKTOP_PROJECT_NAVIGATION_IDS.index}
    >
      <span>{props.index}</span>
    </div>
  )
}
