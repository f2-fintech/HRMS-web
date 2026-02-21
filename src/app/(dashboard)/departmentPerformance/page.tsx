import dynamic from 'next/dynamic';

const DepartmentPerformance = dynamic(
  () => import('@/components/department-performance/department'),
  { ssr: false }
);

export default function DepartmentPerformanceGrid() {
  return <DepartmentPerformance />;
}
