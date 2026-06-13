import React from 'react'
import '@payloadcms/next/css'
import { RootLayout, metadata } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './importMap.js'
import { payloadAdminServerFunction } from './serverFunction'

export { metadata }

function patchHydrationSensitiveNodes(node: React.ReactNode): React.ReactNode {
  if (
    !React.isValidElement<{
      children?: React.ReactNode
      suppressHydrationWarning?: boolean
    }>(node)
  ) {
    return node
  }

  if (typeof node.type !== 'string') {
    return node
  }

  if (node.type === 'style') {
    return React.cloneElement(node, { suppressHydrationWarning: true })
  }

  if (node.type === 'head' || node.type === 'body') {
    const patchedChildren = React.Children.map(
      node.props.children,
      patchHydrationSensitiveNodes,
    )

    return React.cloneElement(
      node,
      { suppressHydrationWarning: true },
      patchedChildren,
    )
  }

  return node
}

export default async function PayloadLayout({ children }: { children: React.ReactNode }) {
  const rootLayout = await RootLayout({
    children,
    config,
    htmlProps: { suppressHydrationWarning: true },
    importMap,
    serverFunction: payloadAdminServerFunction,
  })

  if (!React.isValidElement<{ children?: React.ReactNode; suppressHydrationWarning?: boolean }>(rootLayout)) {
    return rootLayout
  }

  const patchedChildren = React.Children.map(
    rootLayout.props.children,
    patchHydrationSensitiveNodes,
  )

  // Browser extensions sometimes inject styles into <head> before the admin hydrates.
  // Suppress on the html/head/body/style boundary so React can tolerate that mutation.
  return React.cloneElement(rootLayout, { suppressHydrationWarning: true }, patchedChildren)
}
