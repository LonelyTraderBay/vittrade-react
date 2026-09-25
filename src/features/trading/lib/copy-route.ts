function isWebCopyPath(pathname: string) {
  return /\/trade\/copy(?:\/|$)/.test(pathname);
}

export function copyHubPath(pathname: string, prefix: string) {
  return isWebCopyPath(pathname) ? `${prefix}/trade/copy` : `${prefix}/trade/copy-trading`;
}

export function copyProviderPath(pathname: string, prefix: string, providerId: string) {
  return isWebCopyPath(pathname)
    ? `${prefix}/trade/copy/provider/${providerId}`
    : `${prefix}/trade/copy-provider/${providerId}`;
}

export function copyProviderFlowPath(
  pathname: string,
  prefix: string,
  providerId: string,
  flow: 'assessment' | 'configuration' | 'confirmation',
) {
  return `${copyProviderPath(pathname, prefix, providerId)}/${flow}`;
}

export function copyActivePath(pathname: string, prefix: string) {
  return isWebCopyPath(pathname)
    ? `${prefix}/trade/copy/active`
    : `${prefix}/trade/copy-trading/active`;
}
