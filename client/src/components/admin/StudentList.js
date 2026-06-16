import React from 'react';
import { Users } from 'lucide-react';

const StudentList = ({ students = [], loading = false }) => {
  return (
    <div className="border border-zinc-800 rounded bg-zinc-900/10 p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 font-mono text-[11px]">
          <Users size={16} /> Student Roster
        </h3>
      </div>
      {loading ? (
        <div className="text-center py-4 text-zinc-550 text-xs font-mono">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-4 text-zinc-550 text-xs font-mono">No students found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-xs font-mono uppercase text-zinc-400">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Department</th>
                <th className="px-4 py-2 text-right">CGPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-4 py-2 font-semibold text-zinc-200">{student.name}</td>
                  <td className="px-4 py-2 text-zinc-400 font-mono text-xs">{student.email}</td>
                  <td className="px-4 py-2 text-zinc-300 font-mono text-xs">{student.department || 'N/A'}</td>
                  <td className="px-4 py-2 text-right text-zinc-200 font-mono">{student.cgpa || '0.0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentList;
