import dynamic from 'next/dynamic';

const DepartmentPerformanceGrid = dynamic(
  () => import('@/components/department-performance/department'),
  { ssr: false }
);

export default function Page() {
  return <DepartmentPerformanceGrid />;
}
