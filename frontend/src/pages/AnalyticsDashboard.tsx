import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  ChevronDown, Calendar, Sparkles, ArrowUpRight, CheckCircle2, Target, TrendingUp, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

// Mock Data
const barChartData = [
  { name: 'Feb', Planned: 120, Completed: 95, Skipped: 25 },
  { name: 'Mar', Planned: 150, Completed: 120, Skipped: 30 },
  { name: 'Apr', Planned: 180, Completed: 160, Skipped: 20 },
  { name: 'May', Planned: 200, Completed: 190, Skipped: 10 },
  { name: 'Jun', Planned: 210, Completed: 185, Skipped: 25 },
  { name: 'Jul', Planned: 250, Completed: 230, Skipped: 20 },
  { name: 'Aug', Planned: 240, Completed: 220, Skipped: 20 },
  { name: 'Sep', Planned: 260, Completed: 245, Skipped: 15 },
  { name: 'Oct', Planned: 300, Completed: 290, Skipped: 10 },
];

const radialData = [
  { name: 'Health', value: 400, color: '#3b82f6' }, // blue-500
  { name: 'Work', value: 300, color: '#06b6d4' },   // cyan-500
  { name: 'Learning', value: 300, color: '#f97316' } // orange-500
];

const tableData = [
  { habit: 'Morning Run', category: 'Health', streak: '12 Days', logs: 45, completion: '92%' },
  { habit: 'Read 20 Pages', category: 'Learning', streak: '5 Days', logs: 28, completion: '78%' },
  { habit: 'Deep Work Block', category: 'Work', streak: '18 Days', logs: 89, completion: '96%' },
  { habit: 'Meditation', category: 'Mindfulness', streak: '2 Days', logs: 15, completion: '65%' },
  { habit: 'Drink Water', category: 'Health', streak: '31 Days', logs: 124, completion: '100%' },
];

const activityData = [
  { title: 'Completed Morning Run', time: '2 hours ago', icon: <Activity className="h-4 w-4 text-emerald-500" /> },
  { title: 'Missed Reading Session', time: '5 hours ago', icon: <Target className="h-4 w-4 text-rose-500" /> },
  { title: 'New Cycle Started', time: '1 day ago', icon: <Sparkles className="h-4 w-4 text-blue-500" /> },
  { title: 'Achieved 10-day streak!', time: '2 days ago', icon: <TrendingUp className="h-4 w-4 text-orange-500" /> },
];

export default function AnalyticsDashboard() {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Analytics</h1>
              <p className="text-slate-400 text-sm mt-1">Track your consistency and monitor your habits progress.</p>
            </div>
            <Button variant="outline" className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white">
              <Calendar className="mr-2 h-4 w-4" />
              Oct 1, 2026 - Oct 31, 2026
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* ROW 1 */}
            <div className="md:col-span-3">
              <Card className="h-full bg-gradient-to-br from-lime-400 to-lime-500 border-none relative overflow-hidden group">
                <div className="absolute inset-0 bg-lime-400 mix-blend-overlay opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-lime-950 font-bold text-lg leading-tight">Unlock Pro<br/>Analytics</h3>
                    <p className="text-lime-900/80 text-xs mt-2 max-w-[140px]">Get detailed insights into your habits and patterns.</p>
                  </div>
                  <Button className="mt-6 bg-lime-950 text-lime-400 hover:bg-lime-900 w-fit rounded-full text-xs px-5 shadow-lg">
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-3">
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-slate-400">Habits Completed</p>
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-white">1,248</h2>
                      <p className="text-xs text-emerald-500 flex items-center mt-1">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +12.5% from last month
                      </p>
                    </div>
                    {/* Simulated Sparkline */}
                    <div className="flex items-end gap-1 h-8">
                      {[3, 5, 4, 7, 5, 8, 10].map((h, i) => (
                        <div key={i} className="w-1.5 bg-blue-500 rounded-t-sm" style={{ height: `${h * 10}%` }}></div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-3">
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-slate-400">Active Cycles</p>
                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
                      <Target className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-white">14</h2>
                      <p className="text-xs text-emerald-500 flex items-center mt-1">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +2 new this week
                      </p>
                    </div>
                    {/* Simulated Sparkline */}
                    <div className="flex items-end gap-1 h-8">
                      {[5, 6, 5, 8, 9, 7, 10].map((h, i) => (
                        <div key={i} className="w-1.5 bg-cyan-500 rounded-t-sm" style={{ height: `${h * 10}%` }}></div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-3">
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-slate-400">Consistency Growth</p>
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-white">24.5%</h2>
                      <p className="text-xs text-emerald-500 flex items-center mt-1">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +4.1% vs last month
                      </p>
                    </div>
                    {/* Simulated Sparkline */}
                    <div className="flex items-end gap-1 h-8">
                      {[4, 3, 5, 6, 8, 9, 12].map((h, i) => (
                        <div key={i} className="w-1.5 bg-orange-500 rounded-t-sm" style={{ height: `${(h/12) * 100}%` }}></div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ROW 2 */}
            <div className="md:col-span-8">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-white">Completion Consistency</CardTitle>
                  <CardDescription>Planned vs. Done habits from Feb to Oct</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          cursor={{fill: '#1e293b', opacity: 0.4}}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                        <Bar dataKey="Planned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Completed" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Skipped" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-4">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-white">Overview</CardTitle>
                  <CardDescription>Habits distribution by category</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center relative">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={radialData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={4}
                        >
                          {radialData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Absolute Center Text */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-2">
                    <p className="text-3xl font-bold text-white">1.0K</p>
                    <p className="text-xs text-slate-400">Total Logs</p>
                  </div>
                  
                  {/* Legend Below */}
                  <div className="flex items-center justify-center gap-4 mt-4 w-full">
                    {radialData.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs text-slate-300">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ROW 3 */}
            <div className="md:col-span-8">
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-white">Top Habits</CardTitle>
                    <CardDescription>Your best performing habits across all cycles</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30">View All</Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400 font-medium">Habit</TableHead>
                        <TableHead className="text-slate-400 font-medium">Category</TableHead>
                        <TableHead className="text-slate-400 font-medium">Current Streak</TableHead>
                        <TableHead className="text-slate-400 font-medium">Total Logs</TableHead>
                        <TableHead className="text-slate-400 font-medium text-right">Completion Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.map((row, i) => (
                        <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/50">
                          <TableCell className="font-medium text-slate-200">{row.habit}</TableCell>
                          <TableCell className="text-slate-400">{row.category}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300 ring-1 ring-inset ring-slate-700">
                              {row.streak}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-300">{row.logs}</TableCell>
                          <TableCell className="text-right font-medium text-emerald-400">{row.completion}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                  <CardDescription>Latest updates from your tracker</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activityData.map((activity, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
                          {activity.icon}
                        </div>
                        <div className="flex flex-col flex-1 gap-1">
                          <p className="text-sm font-medium leading-none text-slate-200">{activity.title}</p>
                          <p className="text-xs text-slate-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
    </>
  );
}
