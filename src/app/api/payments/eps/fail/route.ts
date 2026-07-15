// EPS fail callback — always verifies via API No.3, never the query params (#7, §8.1).
export { handleEpsCallback as GET } from '@/lib/commerce/epsCallback'
